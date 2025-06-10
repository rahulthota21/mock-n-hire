from fastapi import APIRouter, HTTPException, Query
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

@router.get("/compare-candidates", operation_id="compare_candidates_unique")
async def compare_candidates(resume_ids: list[str] = Query(...)):
    try:
        results = []
        for resume_id in resume_ids:
            response = supabase.table("resume_analysis").select("*").eq("resume_id", resume_id).execute()
            if not response.data:
                continue
            results.append(response.data[0])
        return {"candidates": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", operation_id="get_resume_history_unique")
async def get_resume_history(resume_id: str):
    try:
        original = supabase.table("resume_uploads").select("original_hash").eq("resume_id", resume_id).execute()
        if not original.data:
            raise HTTPException(status_code=404, detail="Resume not found")

        hash_value = original.data[0]["original_hash"]
        if not hash_value:
            return {"history": []}

        history = supabase.table("resume_uploads").select("resume_id, job_id").eq("original_hash", hash_value).execute()
        return {"history": history.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export", operation_id="export_results_unique")
async def export_results(job_id: str, format: str = "csv"):
    try:
        rankings = supabase.table("resume_rankings").select("*").eq("job_id", job_id).order("rank").execute().data
        results = []

        for rank in rankings:
            rid = rank["resume_id"]
            analysis = supabase.table("resume_analysis").select("*").eq("resume_id", rid).execute().data
            upload = supabase.table("resume_uploads").select("*").eq("resume_id", rid).execute().data
            rank["analysis"] = analysis[0] if analysis else {}
            rank["upload"] = upload[0] if upload else {}
            results.append(rank)

        if not results:
            raise HTTPException(status_code=404, detail="No rankings found for this job")

        if format == "csv":
            import csv
            from fastapi.responses import StreamingResponse
            from io import StringIO

            csv_file = StringIO()
            fieldnames = ["resume_id", "job_id", "total_score", "rank"]
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()
            for row in results:
                writer.writerow({
                    "resume_id": row["resume_id"],
                    "job_id": row["job_id"],
                    "total_score": row["total_score"],
                    "rank": row["rank"]
                })
            csv_file.seek(0)
            return StreamingResponse(csv_file, media_type="text/csv")
        else:
            return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
