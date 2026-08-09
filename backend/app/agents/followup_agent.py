from __future__ import annotations

from app.agents.adaptive_interview_planner import AdaptiveInterviewPlannerAgent
from app.schemas.interview import (
    InterviewAdaptiveDecision,
    InterviewConfiguration,
    InterviewEvaluation,
    InterviewPlan,
    InterviewQuestion,
    InterviewSessionRuntime,
)


class FollowUpAgent:
    def __init__(self) -> None:
        self.adaptive = AdaptiveInterviewPlannerAgent()

    def generate_followup(
        self,
        configuration: InterviewConfiguration,
        plan: InterviewPlan,
        current_question: InterviewQuestion | None,
        evaluation: InterviewEvaluation,
        runtime: InterviewSessionRuntime | None = None,
        decision: InterviewAdaptiveDecision | None = None,
    ) -> InterviewQuestion:
        # If no explicit decision provided, ask adaptive planner
        if decision is None:
            # decide next action broadly
            decision = self.adaptive.decide_next_action(
                configuration, plan, current_question, "", evaluation, runtime
            )

        # Use adaptive planner to produce a concrete question based on decision
        next_q = self.adaptive.generate_next_question(
            configuration, plan, current_question, "", evaluation, decision, runtime
        )

        # Tag question stage/difficulty according to decision for tracking
        if decision and decision.stage:
            next_q.stage = decision.stage
        if decision and decision.difficulty:
            next_q.difficulty = decision.difficulty

        return next_q
