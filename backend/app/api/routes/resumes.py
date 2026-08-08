from fastapi import APIRouter, File, UploadFile

from app.core.errors import file_too_large, invalid_resume, unsupported_file_type
from app.schemas.resume import ResumeValidationResponse

router = APIRouter(prefix="/resumes", tags=["resumes"])
MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024


@router.post("/validate", response_model=ResumeValidationResponse)
async def validate_resume(file: UploadFile = File(...)) -> ResumeValidationResponse:
    filename = file.filename or "resume.pdf"
    content_type = (file.content_type or "").lower()

    if not filename.lower().endswith(".pdf") and content_type != "application/pdf":
        raise unsupported_file_type()

    content = await file.read(MAX_RESUME_SIZE_BYTES + 1)
    size = len(content)

    if size > MAX_RESUME_SIZE_BYTES:
        raise file_too_large()

    if not content.startswith(b"%PDF-"):
        raise invalid_resume("Upload a valid PDF file.")

    return ResumeValidationResponse(filename=filename, size=size, valid=True)
