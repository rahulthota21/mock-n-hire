from fastapi import APIRouter, HTTPException, Depends
from api.dependencies import get_supabase
import logging
from typing import List, Dict
import uuid

# Configure basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/sessions")
async def get_all_sessions(supabase=Depends(get_supabase)) -> List[Dict]:
    """
    Retrieve all mock interview sessions with additional details like question count, answer count, and average stress.
    """
    try:
        # Fetch all sessions, ordered by start_time (most recent first)
        sessions = supabase.table("mock_interview_sessions").select("*").order("start_time", desc=True).execute()
        
        if not sessions.data:
            logger.info("No sessions found")
            return []

        # Enhance the response with additional details
        enhanced_sessions = []
        for session in sessions.data:
            session_id = session["id"]

            # Fetch the number of questions
            questions = supabase.table("mock_interview_questions").select("id", count="exact").eq("session_id", session_id).execute()
            question_count = questions.count or 0

            # Fetch the number of answers
            answers = supabase.table("mock_interview_answers").select("id", count="exact").eq("session_id", session_id).execute()
            answer_count = answers.count or 0

            # Fetch the average stress score
            stress_data = supabase.table("mock_interview_stress_analysis").select("stress_score").eq("session_id", session_id).execute()
            stress_scores = [entry["stress_score"] for entry in stress_data.data] if stress_data.data else []
            average_stress = sum(stress_scores) / len(stress_scores) if stress_scores else None

            # Add enhanced details to the session
            enhanced_session = {
                "id": session["id"],
                "user_id": session["user_id"],
                "resume_id": session["resume_id"],
                "start_time": session["start_time"],
                "end_time": session["end_time"],
                "status": session["status"],
                "question_count": question_count,
                "answer_count": answer_count,
                "average_stress": average_stress
            }
            enhanced_sessions.append(enhanced_session)

        logger.info(f"Retrieved {len(enhanced_sessions)} sessions with enhanced details")
        return enhanced_sessions
    except Exception as e:
        logger.error(f"Error retrieving sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving sessions: {str(e)}")

@router.delete("/session/{session_id}")
async def delete_session(session_id: str, supabase=Depends(get_supabase)):
    """
    Delete a specific session and its related data (questions, answers, stress analysis, reports, and associated files).
    """
    try:
        # Validate session_id format (must be a valid UUID)
        try:
            uuid.UUID(session_id)
        except ValueError:
            logger.warning(f"Invalid session_id format: {session_id}")
            raise HTTPException(status_code=400, detail="Invalid session_id format. Must be a valid UUID.")

        # Check if the session exists
        session = supabase.table("mock_interview_sessions").select("id").eq("id", session_id).execute()
        if not session.data:
            logger.warning(f"Session {session_id} not found for deletion")
            raise HTTPException(status_code=404, detail="Session not found")
        
        logger.info(f"Session {session_id} found, proceeding with deletion")

        # Fetch answers to get audio_urls
        answers = supabase.table("mock_interview_answers").select("audio_url").eq("session_id", session_id).execute()
        audio_paths = [answer["audio_url"] for answer in answers.data if answer["audio_url"]]

        # Fetch questions to determine question numbers for video deletion
        questions = supabase.table("mock_interview_questions").select("question_number").eq("session_id", session_id).execute()
        question_numbers = [q["question_number"] for q in questions.data]

        # Delete related data first due to foreign key constraints
        supabase.table("mock_interview_questions").delete().eq("session_id", session_id).execute()
        supabase.table("mock_interview_answers").delete().eq("session_id", session_id).execute()
        supabase.table("mock_interview_stress_analysis").delete().eq("session_id", session_id).execute()
        supabase.table("mock_interview_reports").delete().eq("session_id", session_id).execute()
        
        # Delete the session
        response = supabase.table("mock_interview_sessions").delete().eq("id", session_id).execute()

        # Delete audio files from mock.interview.answers bucket
        for audio_path in audio_paths:
            try:
                supabase.storage.from_("mock.interview.answers").remove([audio_path])
                logger.info(f"Deleted audio file: {audio_path}")
            except Exception as e:
                logger.warning(f"Failed to delete audio file {audio_path}: {str(e)}")

        # Delete video files from mock.interview.videos bucket
        for q_num in question_numbers:
            video_path = f"videos/{session_id}/{q_num}/video.webm"
            try:
                supabase.storage.from_("mock.interview.videos").remove([video_path])
                logger.info(f"Deleted video file: {video_path}")
            except Exception as e:
                logger.warning(f"Failed to delete video file {video_path}: {str(e)}")
        
        logger.info(f"Deleted session {session_id}")
        return {"status": "Session deleted", "session_id": session_id}
    except Exception as e:
        logger.error(f"Error deleting session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting session: {str(e)}")