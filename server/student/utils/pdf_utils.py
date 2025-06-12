import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text from a PDF file."""
    pdf_reader = fitz.open(stream=pdf_content, filetype="pdf")
    text = ""
    for page in pdf_reader:
        text += page.get_text("text") + "\n"
    pdf_reader.close()
    return text.strip()