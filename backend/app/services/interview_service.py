from datetime import datetime, timezone
from typing import Dict
from uuid import uuid4

from app.agents.interview_planner import InterviewPlannerAgent
from app.core.errors import invalid_session
from app.schemas.interview import (
    InterviewConfiguration,
    InterviewCreateRequest,
    InterviewCreateResponse,
    InterviewStartResponse,
)


class InterviewService:
    def __init__(self) -> None:
        self._sessions: Dict[str, InterviewCreateResponse] = {}
        self._created_at: Dict[str, datetime] = {}
        self._planner = InterviewPlannerAgent()

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

    def start_interview(self, session_id: str) -> InterviewStartResponse:
        session = self.get_session(session_id)
        configuration = self._configuration_from_session(session)
        plan = self._planner.create_plan(configuration)
        question = self._planner.generate_first_question(configuration, plan)

        return InterviewStartResponse(
            sessionId=session_id,
            status="started",
            plan=plan,
            question=question,
        )

    def _configuration_from_session(self, session: InterviewCreateResponse) -> InterviewConfiguration:
        config = session.configuration
        if not isinstance(config, InterviewConfiguration):
            return InterviewConfiguration.model_validate(config.model_dump(by_alias=True))
        return config
