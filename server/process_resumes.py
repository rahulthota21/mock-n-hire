# File: process_resumes.py

import openai
import json
import os
import zipfile
import time
from pdfminer.high_level import extract_text
import docx
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from supabase import create_client
from storage_utils import upload_resume_info_to_db 


load_dotenv()
GROQ_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

PROCESSED_DATA_FOLDER = "processed_data"
os.makedirs(PROCESSED_DATA_FOLDER, exist_ok=True)

def extract_zip(zip_path: str, extract_to: str):
    """Extracts ZIP, including nested ZIPs and folders"""
    def _extract(zipfile_path, base_folder):
        with zipfile.ZipFile(zipfile_path, 'r') as zip_ref:
            for item in zip_ref.namelist():
                item_path = os.path.join(base_folder, item)
                if item.endswith('/'):
                    os.makedirs(item_path, exist_ok=True)
                else:
                    zip_ref.extract(item, base_folder)

                    # ✅ If item is another ZIP, extract it recursively
                    if item.lower().endswith('.zip'):
                        nested_zip_path = os.path.join(base_folder, item)
                        nested_folder = os.path.splitext(nested_zip_path)[0]
                        os.makedirs(nested_folder, exist_ok=True)
                        _extract(nested_zip_path, nested_folder)

    os.makedirs(extract_to, exist_ok=True)
    _extract(zip_path, extract_to)


import os
import docx
from pdfminer.high_level import extract_text

def read_resumes(folder_path: str):
    resumes = []

    for root, _, files in os.walk(folder_path):
        for file in files:
            # ✅ Only allow PDF and DOCX
            if not file.lower().endswith((".pdf", ".docx")):
                print(f"⚠️ Skipping unsupported file: {file}")
                continue

            # ✅ Absolute path to file
            path = os.path.join(root, file)

            # ✅ Try to unlock permission if needed (Windows fix)
            try:
                os.chmod(path, 0o644)
            except Exception as e:
                print(f"⚠️ chmod failed for {file}: {e}")

            # ✅ Try to read the file
            try:
                if file.lower().endswith(".pdf"):
                    text = extract_text(path)
                elif file.lower().endswith(".docx"):
                    doc = docx.Document(path)
                    text = "\n".join(p.text for p in doc.paragraphs)

                if text.strip():
                    resumes.append({
                        "filename": os.path.basename(file),  # Clean file name
                        "text": text,
                        "path": path
                    })
                    print(f"✅ Loaded resume: {file}")
                else:
                    print(f"⚠️ Skipped empty resume: {file}")
            except Exception as e:
                print(f"❌ Failed to read {file}: {e}")

    return resumes


def extract_candidate_name(resume_text):
    prompt = f"""
    Extract only the full name of the candidate from this resume text. Just return the name string, nothing else.

    Resume:
    {resume_text[:2000]}
    """

    try:
        response = client.chat.completions.create(
            model="mistral-saba-24b",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Name extraction failed: {e}")
        return "Unknown"

def analyze_resume_mistral(resume_text: str, job_description: str):
    prompt = f"""
You are an AI that evaluates resumes based on job descriptions.
Return your response in JSON only:

{{
  "Key Skills": [],
  "Overall Analysis": "",
  "Certifications & Courses": [],
  "Relevant Projects": [],
  "Soft Skills": [],
  "Overall Match Score": 0-10,
  "Projects Relevance Score": 0-10,
  "Experience Relevance Score": 0-10
}}

### Job Description:
{job_description}

### Resume:
{resume_text[:2000]}
    """
    for attempt in range(5):
        try:
            resp = client.chat.completions.create(
                model="mistral-saba-24b",
                messages=[
                    {"role": "system", "content": "Return only JSON."},
                    {"role": "user", "content": prompt}
                ]
            )
            content = resp.choices[0].message.content.strip()
            content = content.replace(",}", "}").replace(",]", "]")
            if not content.startswith("{"):
                content = "{" + content.split("{",1)[-1]
            if not content.endswith("}"):
                content = content.rsplit("}",1)[0] + "}"
            return json.loads(content)
        except Exception as e:
            print(f"Attempt {attempt+1} error: {e}")
            time.sleep(1.5)

    print("⚠️ Returning default analysis after 5 retries.")
    return {
        "Key Skills": [], "Overall Analysis": "", "Certifications & Courses": [],
        "Relevant Projects": [], "Soft Skills": [],
        "Overall Match Score": 0, "Projects Relevance Score": 0, "Experience Relevance Score": 0
    }

def process_resumes_in_batches(resumes, job_description, weights, job_id, user_id, batch_size=5):
    results = []
    resume_id_map = {}

    for i in range(0, len(resumes), batch_size):
        batch = resumes[i : i + batch_size]

        for r in batch:
            clean_name = os.path.basename(r["filename"]).strip().lower()
            print(f"🧾 Adding to results.json → '{clean_name}'")

            # ⬇ NEW — extract candidate’s full name --------------------
            candidate_name = extract_candidate_name(r["text"])
            print(f"🔎 Extracted name: {candidate_name}")

            # AI analysis
            analysis = analyze_resume_mistral(r["text"], job_description)
            final_score = (
                analysis.get("Experience Relevance Score", 0) * weights.get("experience", 1)
                + analysis.get("Projects Relevance Score", 0) * weights.get("projects", 1)
            )
            analysis["Final Score"] = round(final_score, 2)
            results.append({"filename": r["filename"], "analysis": analysis})

            # DB + Storage upload  (pass candidate_name)
            resume_id = upload_resume_info_to_db(
                r["filename"], r["path"], job_id, user_id, candidate_name
            )
            if resume_id:
                resume_id_map[clean_name] = resume_id
                print(f"🗂️ Stored resume_id for: {clean_name}")
            else:
                print(f"❌ Skipped resume_id for: {r['filename']}")

        print(f"✅ Processed batch {i // batch_size + 1}")
        time.sleep(1.5)

    return results, resume_id_map




def process_all_resumes(
    zip_path: str,
    job_description: str,
    weightages: dict,
    resume_output_folder: str,
    job_id: str,
    user_id: str
):
    print("🚀 Extracting ZIP...")
    extract_zip(zip_path, resume_output_folder)

    print("📄 Reading Resumes...")
    resumes = read_resumes(resume_output_folder)
    if not resumes:
        print("❌ No resumes found.")
        return []

    print("🧠 Analyzing Resumes...")
    results, resume_id_map = process_resumes_in_batches(resumes, job_description, weightages, job_id, user_id)

    job_json_path = os.path.join(PROCESSED_DATA_FOLDER, f"{job_id}_analysis.json")
    with open(job_json_path, "w") as f:
        json.dump(results, f, indent=4)
    print(f"✅ Wrote local job analysis → {job_json_path}")

    try:
        content = json.dumps(results).encode("utf-8")
        storage_path = f"{job_id}/resume_analysis.json"
        supabase.storage.from_("resumes").upload(
            path=storage_path,
            file=content,
            file_options={"content-type": "application/json"}
        )
        print(f"✅ Uploaded to Supabase Storage: resumes/{storage_path}")
    except Exception as e:
        print(f"🚨 Failed to upload analysis JSON: {e}")

    return results, resume_id_map
