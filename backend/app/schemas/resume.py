from pydantic import BaseModel


class ResumeValidationResponse(BaseModel):
    filename: str
    size: int
    valid: bool
