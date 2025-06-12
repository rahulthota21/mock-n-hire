from fastapi import APIRouter, HTTPException, Depends
from api.dependencies import get_supabase, get_whisper_service
import logging
import os
import uuid
import asyncio
import subprocess
import json
import tempfile
import cv2

from utils.supabase_utils import download_file, upload_file

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stress", tags=["stress"])


def extract_duration(path: str) -> float:
    """
    Try ffprobe for an accurate duration; if that fails,
    fall back to OpenCV frame-count / FPS.
    """
    # 1) ffprobe
    try:
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", path
        ]
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT).decode()
        meta = json.loads(out)
        dur = meta.get("format", {}).get("duration")
        if dur:
            return float(dur)
    except Exception:
        logger.debug("ffprobe duration check failed; using OpenCV fallback")

    # 2) OpenCV
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 15.0
    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 1.0
    cap.release()
    return frames / fps


def demux_audio(src: str, dst: str) -> None:
    """
    Extract the Opus audio stream from a WebM container
    without re-encoding.
    """
    subprocess.check_call([
        "ffmpeg", "-y", "-i", src,
        "-vn", "-acodec", "copy", dst
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


@router.post("/analyze-stress/{session_id}/{question_number}")
async def analyze_stress(
    session_id: str,
    question_number: int,
    supabase=Depends(get_supabase),
    whisper_service=Depends(get_whisper_service),
):
    # Give the front-end a short buffer to finish the upload
    await asyncio.sleep(10)

    # Validate UUID
    try:
        uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid session_id format. Must be a valid UUID."
        )

    # Download the raw WebM
    video_bucket_path = f"videos/{session_id}/{question_number}/video.webm"
    try:
        raw_video = download_file("mock.interview.videos", video_bucket_path)
    except Exception as e:
        logger.warning(f"Video not found: {e}")
        raise HTTPException(status_code=404, detail="Video not found in bucket")

    # Write to a temp file
    with tempfile.TemporaryDirectory() as tmp:
        vid_file = os.path.join(tmp, "clip.webm")
        aud_file = os.path.join(tmp, "audio.webm")

        with open(vid_file, "wb") as f:
            f.write(raw_video)

        # 1) Determine duration
        duration = extract_duration(vid_file)

        # 2) Extract audio
        demux_audio(vid_file, aud_file)

        # 3) Upload the raw audio stream
        audio_bucket_path = f"answers/{session_id}/{question_number}/audio.webm"
        with open(aud_file, "rb") as f:
            upload_file("mock.interview.answers", audio_bucket_path, f.read())

        # 4) Transcribe & compute WPM
        transcript = whisper_service.transcribe_audio(aud_file)
        word_count = len(transcript.split())
        wpm = (word_count / duration) * 60

    # Heuristic stress‐scoring
    # baseline 50, penalize too fast/slow
    stress = 50.0
    stress += max(0, wpm - 160) * 0.4
    stress += max(0, 120 - wpm) * 0.4
    stress = min(stress, 100.0)

    level = (
        "High" if stress > 60 else
        "Moderate" if stress > 30 else
        "Low"
    )

    # Upsert into Supabase
    supabase.table("mock_interview_stress_analysis").upsert({
        "session_id": session_id,
        "question_number": question_number,
        "stress_score": stress,
        "stress_level": level,
        "individual_scores": [{"metric": "wpm", "score": stress}],
    }, on_conflict="session_id,question_number").execute()

    logger.info(
        f"Stress analysis complete for {session_id}@Q{question_number}: "
        f"{stress:.1f} ({level})"
    )
    return {"stress_score": stress, "stress_level": level}


@router.get("/average-stress/{session_id}")
async def average_stress(session_id: str, supabase=Depends(get_supabase)):
    # Validate UUID
    try:
        uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid session_id format. Must be a valid UUID."
        )

    result = supabase.table("mock_interview_stress_analysis") \
                     .select("stress_score") \
                     .eq("session_id", session_id) \
                     .execute()

    entries = result.data or []
    if not entries:
        raise HTTPException(status_code=404, detail="No stress data for this session")

    scores = [e["stress_score"] for e in entries]
    avg = sum(scores) / len(scores)
    level = (
        "High" if avg > 60 else
        "Moderate" if avg > 30 else
        "Low"
    )

    logger.info(f"Average stress for {session_id}: {avg:.1f} ({level})")
    return {
        "average_stress": avg,
        "average_stress_level": level,
        "individual_scores": scores
    }
