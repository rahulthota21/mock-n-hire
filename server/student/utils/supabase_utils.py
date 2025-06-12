from supabase import create_client
from config.settings import settings

# Initialize Supabase client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def upload_file(bucket: str, file_path: str, file_content: bytes):
    """Upload a file to Supabase storage."""
    return supabase.storage.from_(bucket).upload(file_path, file_content)

def download_file(bucket: str, file_path: str):
    """Download a file from Supabase storage."""
    return supabase.storage.from_(bucket).download(file_path)