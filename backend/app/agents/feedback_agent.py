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
            "Given the candidate interview evaluations and answers, produce a JSON object with the following keys:\n"
            "interview_summary, overall_score, technical_strengths (list), knowledge_gaps (list), curriculum_coverage (map),\n"
            "communication_assessment, problem_solving_assessment, engineering_depth, recommendations (list), topics_to_revise (list), strengths (list), gaps (list), next (list).\n"
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

            overall = 0
            if runtime.evaluations:
                overall = sum(ev.score for ev in runtime.evaluations) // len(runtime.evaluations)

            curriculum_cov = {str(d): 1 for d in runtime.covered_days}

            interview_summary = (
                "The candidate completed the interview. See strengths, gaps, and next steps for targeted improvement."
            )

            recommendations = next_steps + ["Practice concrete examples and edge cases."]
            topics_to_revise = list(dict.fromkeys(gaps))[:5]

            return FinalFeedback(
                interview_summary=interview_summary,
                overall_score=int(overall),
                technical_strengths=strengths,
                knowledge_gaps=gaps,
                curriculum_coverage=curriculum_cov,
                communication_assessment=("Clear and structured" if overall >= 70 else "Needs clearer structure and examples"),
                problem_solving_assessment=("Shows sound problem-solving" if overall >= 65 else "Work on stepwise decomposition and reasoning"),
                engineering_depth=("Sufficient technical depth" if overall >= 75 else "Increase implementation detail and tradeoffs"),
                recommendations=recommendations,
                topics_to_revise=topics_to_revise,
                strengths=strengths,
                gaps=gaps,
                next=next_steps,
            )
