from fastapi import APIRouter, Depends, Header, HTTPException
import jwt
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[-1]
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or missing token")

@router.get("/my-screenings")
async def get_user_screenings(user_id: str = Depends(get_current_user)):
    try:
        jobs = supabase.table("job_descriptions").select("job_id, job_title, created_at").eq("user_id", user_id).order("created_at", desc=True).execute()
        return jobs.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch screenings: {str(e)}")
