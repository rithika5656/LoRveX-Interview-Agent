from __future__ import annotations

from app.ai.openai_provider import OpenAIProvider
from app.ai.provider import AIProvider, InterviewPlan, InterviewQuestion
from app.core.config import settings
from app.schemas.interview import InterviewConfiguration, InterviewPlanStage


class InterviewPlannerAgent:
    def __init__(self, provider: AIProvider | None = None) -> None:
        self.provider = provider or OpenAIProvider(api_key=settings.ai_api_key)

    def create_plan(self, configuration: InterviewConfiguration) -> InterviewPlan:
        return self.provider.build_plan(configuration)

    def generate_first_question(self, configuration: InterviewConfiguration, plan: InterviewPlan) -> InterviewQuestion:
        return self.provider.generate_first_question(configuration, plan)
