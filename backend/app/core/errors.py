from fastapi import HTTPException


def api_error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"error": {"code": code, "message": message}})


def invalid_request(message: str = "Invalid request data.") -> HTTPException:
    return api_error(422, "invalid_request", message)


def invalid_session(message: str = "Interview session not found.") -> HTTPException:
    return api_error(404, "invalid_session", message)


def invalid_resume(message: str = "Invalid resume upload.") -> HTTPException:
    return api_error(400, "invalid_resume", message)


def file_too_large(message: str = "Resume must be 5 MB or smaller.") -> HTTPException:
    return api_error(413, "file_too_large", message)


def unsupported_file_type(message: str = "Only PDF resumes are supported.") -> HTTPException:
    return api_error(415, "unsupported_file_type", message)
