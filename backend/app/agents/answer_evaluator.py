from __future__ import annotations

from app.ai.openai_provider import OpenAIProvider
from app.ai.provider import AIProvider
from app.core.config import settings
from app.schemas.interview import InterviewConfiguration, InterviewEvaluation, InterviewQuestion, InterviewSessionRuntime


class AnswerEvaluatorAgent:
    def __init__(self, provider: AIProvider | None = None) -> None:
        self.provider = provider or OpenAIProvider(api_key=settings.ai_api_key)

    def evaluate_answer(
        self,
        configuration: InterviewConfiguration,
        question: InterviewQuestion,
        candidate_answer: str,
        runtime: InterviewSessionRuntime | None = None,
    ) -> InterviewEvaluation:
        return self.provider.evaluate_answer(configuration, question, candidate_answer, runtime)
