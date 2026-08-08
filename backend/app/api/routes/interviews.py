from fastapi import APIRouter, Depends, Request

from app.schemas.interview import InterviewCreateRequest, InterviewCreateResponse, InterviewStartResponse
from app.services.interview_service import InterviewService

router = APIRouter(prefix="/interviews", tags=["interviews"])


def get_interview_service(request: Request) -> InterviewService:
    return request.app.state.interview_service


@router.post("", response_model=InterviewCreateResponse)
def create_interview(
    payload: InterviewCreateRequest,
    interview_service: InterviewService = Depends(get_interview_service),
) -> InterviewCreateResponse:
    return interview_service.create_session(payload)


@router.get("/{session_id}", response_model=InterviewCreateResponse)
def get_interview(
    session_id: str,
    interview_service: InterviewService = Depends(get_interview_service),
) -> InterviewCreateResponse:
    return interview_service.get_session(session_id)


@router.post("/{session_id}/start", response_model=InterviewStartResponse)
def start_interview(
    session_id: str,
    interview_service: InterviewService = Depends(get_interview_service),
) -> InterviewStartResponse:
    return interview_service.start_interview(session_id)
