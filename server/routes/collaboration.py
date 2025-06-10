from fastapi import APIRouter, HTTPException, Form
from pydantic import BaseModel
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

class NoteUpdate(BaseModel):
    resume_id: str
    notes: str | None = None
    tagged_users: list[str] | None = None

@router.post("/add-note")
async def add_or_update_note(data: NoteUpdate):
    try:
        update_data = {}
        if data.notes is not None:
            update_data["notes"] = data.notes
        if data.tagged_users is not None:
            update_data["tagged_users"] = data.tagged_users

        response = supabase.table("resume_analysis").update(update_data).eq("resume_id", data.resume_id).execute()
        return {"message": "Note updated successfully", "resume_id": data.resume_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notes")
async def get_note(resume_id: str):
    try:
        response = supabase.table("resume_analysis").select("notes, tagged_users").eq("resume_id", resume_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="No note found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
