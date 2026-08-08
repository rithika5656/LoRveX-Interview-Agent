from datetime import datetime, timezone
from typing import Dict
from uuid import uuid4

from app.core.errors import invalid_session
from app.schemas.interview import InterviewCreateRequest, InterviewCreateResponse


class InterviewService:
    def __init__(self) -> None:
        self._sessions: Dict[str, InterviewCreateResponse] = {}
        self._created_at: Dict[str, datetime] = {}

    def create_session(self, configuration: InterviewCreateRequest) -> InterviewCreateResponse:
        session_id = uuid4().hex
        response = InterviewCreateResponse(sessionId=session_id, configuration=configuration)
        self._sessions[session_id] = response
        self._created_at[session_id] = datetime.now(timezone.utc)
        return response

    def get_session(self, session_id: str) -> InterviewCreateResponse:
        session = self._sessions.get(session_id)
        if session is None:
            raise invalid_session()

        return session
