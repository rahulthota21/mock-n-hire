from fastapi import APIRouter, HTTPException, Depends, Body, File, UploadFile
from pydantic import BaseModel
from api.dependencies import get_supabase, get_groq_service, get_whisper_service, get_report_service
from utils.supabase_utils import upload_file, download_file
from utils.pdf_utils import extract_text_from_pdf
from models.schemas import Question, NextQuestionResponse, FinalReportResponse, UserSummaryResponse
import os
from datetime import datetime
import logging
import uuid
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interview", tags=["interview"])

class AnswerPayload(BaseModel):
    answer_text: str | None = None

@router.get("/")
async def root():
    return {
        "message": "Mock Interview Backend",
        "supabase_url": os.getenv("SUPABASE_URL")
    }

@router.get("/test-supabase")
async def test_supabase(supabase=Depends(get_supabase)):
    try:
        valid_user_id = "386b7b8e-6242-424f-aad8-9e02ae93678e"
        response = supabase.table("mock_interview_users").upsert({
            "user_id": valid_user_id,
            "role": "candidate"
        }, on_conflict="user_id").execute()
        logger.info(f"Supabase test successful for user_id: {valid_user_id}")
        return {"status": "Supabase connected", "data": response.data}
    except Exception as e:
        logger.error(f"Supabase test failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")

@router.post("/upload-resume/{mock_user_id}")
async def upload_resume(mock_user_id: str, file: UploadFile = File(...), supabase=Depends(get_supabase)):
    try:
        try:
            uuid.UUID(mock_user_id)
        except ValueError:
            logger.warning(f"Invalid mock_user_id format: {mock_user_id}")
            raise HTTPException(status_code=400, detail="Invalid mock_user_id format. Must be a valid UUID.")

        try:
            logger.info(f"Upserting user {mock_user_id} into mock_interview_users")
            supabase.table("mock_interview_users").upsert({
                "user_id": mock_user_id,
                "role": "student"
            }, on_conflict="user_id").execute()
        except Exception as e:
            logger.error(f"Failed to upsert user {mock_user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to ensure user exists in system")

        if not file.filename.endswith(".pdf"):
            logger.warning(f"Invalid file format for user {mock_user_id}: {file.filename}")
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        file_content = file.file.read()
        resume_text = extract_text_from_pdf(file_content)

        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        base_filename = file.filename.rsplit(".", 1)[0]
        file_extension = file.filename.rsplit(".", 1)[1]
        unique_filename = f"{base_filename}_{timestamp}.{file_extension}"
        file_path = f"{mock_user_id}/{unique_filename}"
        file.file.seek(0)
        upload_file("mock.interview.resumes", file_path, file.file.read())

        response = supabase.table("mock_interview_resumes").insert({
            "user_id": mock_user_id,
            "file_path": file_path
        }).execute()

        resume_id = response.data[0]["id"]
        logger.info(f"Resume uploaded for user {mock_user_id}: {file_path}, resume_id: {resume_id}")
        return {
            "status": "Resume uploaded",
            "resume_id": resume_id,
            "user_id": mock_user_id
        }
    except Exception as e:
        logger.error(f"Error uploading resume for user {mock_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading resume: {str(e)}")

@router.post("/generate-questions/{mock_user_id}/{resume_id}")
async def generate_questions(mock_user_id: str, resume_id: str, supabase=Depends(get_supabase), groq_service=Depends(get_groq_service)):
    try:
        try:
            uuid.UUID(mock_user_id)
        except ValueError:
            logger.warning(f"Invalid mock_user_id format: {mock_user_id}")
            raise HTTPException(status_code=400, detail="Invalid mock_user_id format. Must be a valid UUID.")
        try:
            uuid.UUID(resume_id)
        except ValueError:
            logger.warning(f"Invalid resume_id format: {resume_id}")
            raise HTTPException(status_code=400, detail="Invalid resume_id format. Must be a valid UUID.")

        resume_data = supabase.table("mock_interview_resumes").select("*").eq("id", resume_id).execute()
        if not resume_data.data:
            logger.warning(f"Resume not found for resume_id: {resume_id}")
            raise HTTPException(status_code=404, detail="Resume not found")

        file_path = resume_data.data[0]["file_path"]
        file_response = download_file("mock.interview.resumes", file_path)

        with open("temp.pdf", "wb") as f:
            f.write(file_response)
        resume_text = extract_text_from_pdf(file_response)
        os.remove("temp.pdf")

        questions = groq_service.generate_interview_questions(resume_text)

        session_response = supabase.table("mock_interview_sessions").insert({
            "user_id": mock_user_id,
            "resume_id": resume_id
        }).execute()
        session_id = session_response.data[0]["id"]

        for idx, question in enumerate(questions, start=1):
            supabase.table("mock_interview_questions").insert({
                "session_id": session_id,
                "question_text": question["text"],
                "category": question["category"],
                "question_number": idx,
                "is_answered": False
            }).execute()

        logger.info(f"Generated {len(questions)} questions for session {session_id}")
        return {"status": "Questions generated", "session_id": session_id, "questions": [q["text"] for q in questions]}
    except Exception as e:
        logger.error(f"Error generating questions for user {mock_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}")

@router.get("/next-question/{session_id}/{question_number}", response_model=NextQuestionResponse)
async def get_next_question(session_id: str, question_number: int, supabase=Depends(get_supabase)):
    try:
        try:
            uuid.UUID(session_id)
        except ValueError:
            logger.warning(f"Invalid session_id format: {session_id}")
            raise HTTPException(status_code=400, detail="Invalid session_id format. Must be a valid UUID.")

        question = supabase.table("mock_interview_questions").select("*").eq("session_id", session_id).eq("question_number", question_number).single().execute()
        if not question.data:
            logger.warning(f"Question not found for session {session_id}, question_number {question_number}")
            raise HTTPException(status_code=404, detail="Question not found")

        total_questions = supabase.table("mock_interview_questions").select("id", count="exact").eq("session_id", session_id).execute().count

        logger.info(f"Retrieved question {question_number} for session {session_id}")
        return {
            "status": "Question retrieved",
            "question": question.data["question_text"],
            "category": question.data["category"],
            "question_number": question_number,
            "total_questions": total_questions
        }
    except Exception as e:
        logger.error(f"Error retrieving question for session {session_id}, question_number {question_number}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving question: {str(e)}")


# ------------------- SUBMIT-ANSWER UPDATED -------------------
@router.post("/submit-answer/{session_id}/{question_number}")
async def submit_answer(
    session_id: str,
    question_number: int,
    payload: AnswerPayload | None = Body(None, embed=True),
    supabase=Depends(get_supabase),
    groq_service=Depends(get_groq_service),
    whisper_service=Depends(get_whisper_service)
):
    # Build audio path
    audio_path = f"answers/{session_id}/{question_number}/audio.webm"
    max_retries = 2
    delay_between_retries = 3  # seconds

    audio_downloaded = False
    error_detail = ""
    audio_response = None

    for attempt in range(1, max_retries + 2):  # try 1+retries times
        try:
            audio_response = download_file("mock.interview.answers", audio_path)
            audio_downloaded = True
            logger.info(f"Audio found on attempt {attempt} at {audio_path}")
            break
        except Exception as e:
            error_detail = f"Attempt {attempt}: {e}"
            logger.warning(f"Audio file not found on attempt {attempt} at {audio_path}: {e}")
            if attempt <= max_retries:
                await asyncio.sleep(delay_between_retries)

    if not audio_downloaded:
        logger.error(f"Audio file missing after {max_retries + 1} attempts for session {session_id}, question {question_number}. Last error: {error_detail}")
        raise HTTPException(status_code=404, detail=f"Audio file not found after {max_retries + 1} attempts. Error: {error_detail}")

    try:
        # Fetch question text
        question = supabase.table("mock_interview_questions").select("question_text").eq("session_id", session_id).eq("question_number", question_number).single().execute()
        if not question.data:
            logger.warning(f"Question not found for session {session_id}, question_number {question_number}")
            raise HTTPException(status_code=404, detail="Question not found")
        question_text = question.data["question_text"]

        # Transcribe audio
        temp_audio_path = f"temp_answer_{session_id}_{question_number}_audio.webm"
        with open(temp_audio_path, "wb") as f:
            f.write(audio_response)
        final_answer_text = whisper_service.transcribe_audio(temp_audio_path)
        os.remove(temp_audio_path)
        audio_url = audio_path

        # Evaluate answer
        evaluation = groq_service.evaluate_answer(question_text, final_answer_text)
        score = evaluation["score"]
        feedback = evaluation["feedback"]

        answer_data = {
            "session_id": session_id,
            "question_number": question_number,
            "answer_text": final_answer_text,
            "audio_url": audio_url,
            "score": score,
            "feedback": feedback
        }
        response = supabase.table("mock_interview_answers").upsert(answer_data, on_conflict="session_id , question_number").execute()

        supabase.table("mock_interview_questions").update({
            "is_answered": True
        }).eq("session_id", session_id).eq("question_number", question_number).execute()

        logger.info(f"Answer submitted for session {session_id}, question {question_number}. Score: {score}")
        return {
            "status": "Answer submitted",
            "data": response.data,
            "score": score,
            "feedback": feedback
        }
    except Exception as e:
        logger.error(f"Error submitting answer for session {session_id}, question {question_number}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error submitting answer: {str(e)}")
# ------------------- SUBMIT-ANSWER UPDATED END -------------------


@router.get("/final-report/{session_id}", response_model=FinalReportResponse)
async def get_final_report(session_id: str, report_service=Depends(get_report_service)):
    try:
        try:
            uuid.UUID(session_id)
        except ValueError:
            logger.warning(f"Invalid session_id format: {session_id}")
            raise HTTPException(status_code=400, detail="Invalid session_id format. Must be a valid UUID.")

        logger.info(f"Generating final report for session {session_id}")
        report = report_service.generate_final_report(session_id)
        logger.info(f"Final report generated for session {session_id}")
        return report
    except Exception as e:
        logger.error(f"Error generating final report for session {session_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating final report: {str(e)}")

@router.get("/user-summary/{mock_user_id}", response_model=UserSummaryResponse)
async def get_user_summary(mock_user_id: str, report_service=Depends(get_report_service)):
    try:
        try:
            uuid.UUID(mock_user_id)
        except ValueError:
            logger.warning(f"Invalid mock_user_id format: {mock_user_id}")
            raise HTTPException(status_code=400, detail="Invalid mock_user_id format. Must be a valid UUID.")

        logger.info(f"Generating user summary for user {mock_user_id}")
        summary = report_service.generate_user_summary(mock_user_id)
        logger.info(f"User summary generated for user {mock_user_id}")
        return summary
    except Exception as e:
        logger.error(f"Error generating user summary for user {mock_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating user summary: {str(e)}")
