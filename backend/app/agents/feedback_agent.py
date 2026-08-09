from __future__ import annotations

from typing import List

from app.services.llm_service import llm_service, LLMServiceError
from app.schemas.interview import InterviewSessionRuntime, FinalFeedback


class FeedbackAgent:
    def __init__(self) -> None:
        self.llm = llm_service

    def generate_feedback(self, runtime: InterviewSessionRuntime) -> FinalFeedback:
        # Build a concise summary prompt from evaluations and answers
        lines: List[str] = []
        lines.append(f"Candidate: {runtime.configuration.candidate_name}")
        lines.append(f"Role: {runtime.configuration.target_role}")
        lines.append(f"Questions asked: {len(runtime.question_history)}")
        for ev in runtime.evaluations:
            lines.append(f"Q:{ev.question_id} Score:{ev.score} Assessment:{ev.assessment}")

        prompt = (
            "Given the candidate interview evaluations and answers, produce a JSON object with keys: summary, strengths (list), gaps (list), next (list).\n"
            "Here are the evaluation lines:\n" + "\n".join(lines)
        )

        try:
            feedback = self.llm.generate_structured(prompt, FinalFeedback)
            return feedback
        except LLMServiceError:
            # deterministic fallback
            strengths = []
            gaps = []
            for ev in runtime.evaluations:
                strengths.extend(ev.strengths or [])
                gaps.extend(ev.gaps or ev.weaknesses or [])

            strengths = list(dict.fromkeys(strengths))[:5]
            gaps = list(dict.fromkeys(gaps))[:5]
            next_steps = [f"Review curriculum day {d}" for d in runtime.covered_days[:4]]

            summary = (
                "The candidate showed strengths in the areas listed and would benefit from focused study on the identified gaps."
            )
            return FinalFeedback(summary=summary, strengths=strengths, gaps=gaps, next=next_steps)
