from abc import ABC, abstractmethod

from app.schemas.interview import InterviewConfiguration, InterviewPlan, InterviewQuestion


class AIProvider(ABC):
    """Abstract interface for a provider-backed interview planner."""

    @abstractmethod
    def build_plan(self, configuration: InterviewConfiguration) -> InterviewPlan:
        """Return a structured interview plan from a stored configuration."""

    @abstractmethod
    def generate_first_question(self, configuration: InterviewConfiguration, plan: InterviewPlan) -> InterviewQuestion:
        """Return the first interview question for this session."""
