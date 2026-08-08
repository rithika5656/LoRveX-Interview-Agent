from abc import ABC, abstractmethod

from app.schemas.interview import (
    InterviewAdaptiveDecision,
    InterviewConfiguration,
    InterviewEvaluation,
    InterviewPlan,
    InterviewQuestion,
    InterviewSessionRuntime,
)


class AIProvider(ABC):
    """Abstract interface for a provider-backed interview planner/evaluator."""

    @abstractmethod
    def build_plan(self, configuration: InterviewConfiguration) -> InterviewPlan:
        """Return a structured interview plan from a stored configuration."""

    @abstractmethod
    def generate_first_question(self, configuration: InterviewConfiguration, plan: InterviewPlan) -> InterviewQuestion:
        """Return the first interview question for this session."""

    @abstractmethod
    def evaluate_answer(
        self,
        configuration: InterviewConfiguration,
        question: InterviewQuestion,
        candidate_answer: str,
        runtime: InterviewSessionRuntime | None = None,
    ) -> InterviewEvaluation:
        """Return a structured evaluation for a submitted answer."""

    @abstractmethod
    def decide_next_action(
        self,
        configuration: InterviewConfiguration,
        interview_plan: InterviewPlan,
        current_question: InterviewQuestion | None,
        candidate_answer: str,
        evaluation: InterviewEvaluation,
        runtime: InterviewSessionRuntime | None = None,
    ) -> InterviewAdaptiveDecision:
        """Return a validated adaptive decision for what happens next."""

    @abstractmethod
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
        """Generate the next interview question from the decision context."""
