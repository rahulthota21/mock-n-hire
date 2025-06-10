from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_resume_analysis(resume_id, analysis):
    try:
        response = supabase.table("resume_analysis").insert(analysis).execute()
        return response
    except Exception as e:
        print(f"Error inserting analysis into database: {e}")
        return None

def update_resume_status(resume_id, status):
    try:
        response = supabase.table("resume_uploads").update({"status": status}).eq("resume_id", resume_id).execute()
        return response
    except Exception as e:
        print(f"Error updating resume status: {e}")
        return None

def fetch_analysis(resume_id):
    try:
        response = supabase.table("resume_analysis").select("*").eq("resume_id", resume_id).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching analysis from database: {e}")
        return None
