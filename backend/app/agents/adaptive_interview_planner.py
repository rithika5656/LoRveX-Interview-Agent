from __future__ import annotations

from app.ai.openai_provider import OpenAIProvider
from app.ai.provider import AIProvider
from app.core.config import settings
from app.schemas.interview import (
    InterviewAdaptiveDecision,
    InterviewConfiguration,
    InterviewEvaluation,
    InterviewPlan,
    InterviewQuestion,
    InterviewSessionRuntime,
)


class AdaptiveInterviewPlannerAgent:
    def __init__(self, provider: AIProvider | None = None) -> None:
        self.provider = provider or OpenAIProvider(api_key=settings.ai_api_key)

    def decide_next_action(
        self,
        configuration: InterviewConfiguration,
        interview_plan: InterviewPlan,
        current_question: InterviewQuestion | None,
        candidate_answer: str,
        evaluation: InterviewEvaluation,
        runtime: InterviewSessionRuntime | None = None,
    ) -> InterviewAdaptiveDecision:
        return self.provider.decide_next_action(
            configuration,
            interview_plan,
            current_question,
            candidate_answer,
            evaluation,
            runtime,
        )

    def generate_next_question(
        self,
        configuration: InterviewConfiguration,
        interview_plan: InterviewPlan,
        current_question: InterviewQuestion | None,
        candidate_answer: str,
        evaluation: InterviewEvaluation,
        decision: InterviewAdaptiveDecision,
        runtime: InterviewSessionRuntime | None = None,
    ) -> InterviewQuestion:
        return self.provider.generate_next_question(
            configuration,
            interview_plan,
            current_question,
            candidate_answer,
            evaluation,
            decision,
            runtime,
        )
