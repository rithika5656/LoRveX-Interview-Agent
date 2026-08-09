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
            strengths = []
            gaps = []
            misconceptions_list = []
            for ev in runtime.evaluations:
                strengths.extend(ev.strengths or [])
                gaps.extend(ev.gaps or ev.weaknesses or [])
                if getattr(ev, "misconceptions", None):
                    misconceptions_list.extend(ev.misconceptions)

            strengths = list(dict.fromkeys(strengths))[:5]
            gaps = list(dict.fromkeys(gaps))[:5]
            if not strengths:
                strengths = ["Strong engagement with cohort curriculum", "Clear communication of engineering concepts"]
            if not gaps:
                gaps = ["Deepen production edge-case analysis", "Practice formal evaluation metrics"]

            next_steps = [f"Review cohort curriculum Day {d}" for d in (runtime.covered_days[:4] if runtime.covered_days else [1, 2, 3, 4])]

            overall = 0
            if runtime.evaluations:
                overall = sum(ev.score for ev in runtime.evaluations) // len(runtime.evaluations)
            else:
                overall = 75

            curriculum_cov = {str(d): 1 for d in runtime.covered_days} if runtime.covered_days else {"1": 1, "2": 1, "3": 1, "4": 1}

            interview_summary = (
                f"{runtime.configuration.candidate_name} completed a {len(runtime.question_history)}-question adaptive interview "
                f"covering {len(runtime.covered_days)} curriculum days for the {runtime.configuration.target_role} track."
            )

            recommendations = next_steps + ["Practice concrete architecture diagrams and edge-case handling under production loads."]
            topics_to_revise = list(dict.fromkeys(gaps + misconceptions_list))[:5]

            return FinalFeedback(
                interview_summary=interview_summary,
                overall_score=int(overall),
                technical_strengths=strengths,
                knowledge_gaps=gaps,
                curriculum_coverage=curriculum_cov,
                communication_assessment=("Clear and structured technical explanations" if overall >= 70 else "Needs clearer structure and implementation examples"),
                problem_solving_assessment=("Demonstrated sound engineering problem-solving" if overall >= 65 else "Focus on stepwise decomposition and architectural tradeoffs"),
                engineering_depth=("Sufficient technical depth across core cohort modules" if overall >= 75 else "Increase implementation detail, failure modes, and tradeoffs"),
                recommendations=recommendations,
                topics_to_revise=topics_to_revise,
                strengths=strengths,
                gaps=gaps,
                next=next_steps,
            )

