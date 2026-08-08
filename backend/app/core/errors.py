from fastapi import HTTPException


def api_error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"error": {"code": code, "message": message}})


def invalid_request(message: str = "Invalid request data.") -> HTTPException:
    return api_error(422, "invalid_request", message)


def invalid_session(message: str = "Interview session not found.") -> HTTPException:
    return api_error(404, "invalid_session", message)


def invalid_resume(message: str = "Invalid resume upload.") -> HTTPException:
    return api_error(400, "invalid_resume", message)


def interview_not_started(message: str = "Interview has not been started yet.") -> HTTPException:
    return api_error(400, "interview_not_started", message)


def invalid_question(message: str = "Invalid question identifier.") -> HTTPException:
    return api_error(400, "invalid_question", message)


def empty_answer(message: str = "Answer must not be empty.") -> HTTPException:
    return api_error(422, "empty_answer", message)


def duplicate_answer(message: str = "This question has already been answered.") -> HTTPException:
    return api_error(409, "duplicate_answer", message)


def file_too_large(message: str = "Resume must be 5 MB or smaller.") -> HTTPException:
    return api_error(413, "file_too_large", message)


def unsupported_file_type(message: str = "Only PDF resumes are supported.") -> HTTPException:
    return api_error(415, "unsupported_file_type", message)
