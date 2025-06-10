# File: rank_candidates.py
# --------------------------------------------------------------------------
# Reads <job_id>_analysis.json  → normalizes scores → ranks candidates
# → writes JSON & CSV → inserts into Supabase (resume_rankings).
# Adds new columns candidate_name + status = 'unreviewed'.
# --------------------------------------------------------------------------

import os
import json
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from supabase import create_client
from dotenv import load_dotenv

# ─── ENV ────────────────────────────────────────────────────────────────
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── CONSTANTS ─────────────────────────────────────────────────────────
PROCESSED_DATA_FOLDER = "processed_data"
DEFAULT_STATUS = "unreviewed"           # recruiter will change later


# ─── MAIN PIPELINE ─────────────────────────────────────────────────────
def compute_relative_ranking(job_id: str) -> None:
    """
    1. Load <job_id>_analysis.json (created by process_resumes.py)
    2. Normalize 'Final Score' → 0-100 Relative Ranking Score
    3. Sort & save JSON + CSV
    4. Upsert rows into resume_rankings
    """
    in_path = os.path.join(PROCESSED_DATA_FOLDER, f"{job_id}_analysis.json")
    if not os.path.exists(in_path):
        print(f"❌ analysis file not found: {in_path}")
        return

    with open(in_path) as f:
        raw = json.load(f)
    if not raw:
        print("❌ analysis JSON is empty.")
        return

    # ── 1) collect Final Score & normalize ────────────────────────────
    scores = [
        row["analysis"].get("Final Score", 0.0) or 0.0 for row in raw
    ]
    scaler = MinMaxScaler()
    normed = scaler.fit_transform([[s] for s in scores])

    for idx, row in enumerate(raw):
        pct = round(float(normed[idx][0]) * 100, 2)
        row["analysis"]["Relative Ranking Score"] = pct

    ranked = sorted(
        raw,
        key=lambda r: r["analysis"]["Relative Ranking Score"],
        reverse=True,
    )

    # ── 2) write artifacts ────────────────────────────────────────────
    out_json = os.path.join(PROCESSED_DATA_FOLDER, f"{job_id}_ranked.json")
    out_csv  = os.path.join(PROCESSED_DATA_FOLDER, f"{job_id}_ranked.csv")

    with open(out_json, "w") as f:
        json.dump(ranked, f, indent=4)

    pd.DataFrame(
        [{"filename": r["filename"], **r["analysis"]} for r in ranked]
    ).to_csv(out_csv, index=False)

    print(f"✅ Ranked output saved:\n   • {out_json}\n   • {out_csv}")

    # ── 3) push to Supabase ───────────────────────────────────────────
    _upsert_rankings(ranked, job_id)


# ─── helper: insert / update Supabase rows ─────────────────────────────
def _upsert_rankings(ranked_list: list, job_id: str) -> None:
    records = []
    for idx, cand in enumerate(ranked_list, start=1):
        file_name = cand["filename"]

        # ↳ find resume_id from resume_uploads
        resp = (
            supabase.table("resume_uploads")
            .select("resume_id")
            .eq("file_name", file_name)
            .eq("job_id", job_id)
            .single()
            .execute()
        )
        resume_id = (resp.data or {}).get("resume_id")
        if not resume_id:
            print(f"⚠️  No resume_uploads row for {file_name}; skipping.")
            continue

        records.append(
            {
                "resume_id": resume_id,
                "job_id": job_id,
                "rank": idx,
                "total_score": cand["analysis"]["Relative Ranking Score"],
                "candidate_name": file_name.replace(".pdf", ""),
                "status": DEFAULT_STATUS,
            }
        )

    if not records:
        print("⚠️  No valid records to insert.")
        return

    # Delete existing rankings for this job_id
    supabase.table("resume_rankings").delete().eq("job_id", job_id).execute()
    print(f"✅ Deleted existing rankings for job {job_id}")

    # Insert new rankings
    supabase.table("resume_rankings").insert(records).execute()
    print(f"✅ Supabase: inserted {len(records)} rows into resume_rankings")


# ─── CLI entry ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python rank_candidates.py <job_id>")
        sys.exit(1)

    compute_relative_ranking(sys.argv[1])
