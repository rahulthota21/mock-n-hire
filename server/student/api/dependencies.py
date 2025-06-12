from utils.supabase_utils import supabase
from core.groq_service import GroqService
from core.stress_service import StressService
from core.whisper_service import WhisperService
from core.report_service import ReportService
from fastapi import Depends

def get_supabase():
    return supabase

def get_groq_service():
    return GroqService()

def get_whisper_service():
    return WhisperService()

def get_stress_service(whisper_service=Depends(get_whisper_service)):
    return StressService(whisper_service=whisper_service)

def get_report_service(supabase=Depends(get_supabase), groq_service=Depends(get_groq_service)):
    return ReportService(supabase=supabase, groq_service=groq_service)