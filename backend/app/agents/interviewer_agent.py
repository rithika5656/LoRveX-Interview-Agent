from __future__ import annotations

from typing import Optional

from app.agents.interview_planner import InterviewPlannerAgent
from app.agents.adaptive_interview_planner import AdaptiveInterviewPlannerAgent
from app.agents.answer_evaluator import AnswerEvaluatorAgent
from app.services.candidate_service import candidate_service
from app.services.curriculum_service import curriculum_service
from app.schemas.interview import (
    InterviewConfiguration,
    InterviewPlan,
    InterviewQuestion,
    InterviewSessionRuntime,
    InterviewEvaluation,
)


class InterviewerAgent:
    def __init__(self) -> None:
        self.planner = InterviewPlannerAgent()
        self.adaptive = AdaptiveInterviewPlannerAgent()
        self.evaluator = AnswerEvaluatorAgent()

    def start(self, configuration: InterviewConfiguration) -> tuple[InterviewPlan, InterviewQuestion]:
        plan = self.planner.create_plan(configuration)
        q = self.planner.generate_first_question(configuration, plan)
        return plan, q

    def next_question(
        self,
        configuration: InterviewConfiguration,
        plan: InterviewPlan,
        current_question: Optional[InterviewQuestion],
        candidate_answer: str,
        runtime: Optional[InterviewSessionRuntime] = None,
    ) -> tuple[InterviewQuestion, InterviewEvaluation]:
        # Evaluate answer first
        evaluation = self.evaluator.evaluate_answer(configuration, current_question, candidate_answer, runtime)

        # Decide next action
        decision = self.adaptive.decide_next_action(configuration, plan, current_question, candidate_answer, evaluation, runtime)

        # Generate next question based on decision
        next_q = self.adaptive.generate_next_question(configuration, plan, current_question, candidate_answer, evaluation, decision, runtime)

        # Ensure deduplication by checking text against runtime history
        if runtime:
            texts = {q.text for q in runtime.question_history}
            if next_q.text in texts:
                # fallback: tweak id to avoid duplicates
                next_q.id = f"{next_q.id}-dup"

        return next_q, evaluation
