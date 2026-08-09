from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from app.ai.provider import AIProvider
from app.core.config import settings
from app.schemas.interview import (
    InterviewAdaptiveDecision,
    InterviewConfiguration,
    InterviewEvaluation,
    InterviewPlan,
    InterviewPlanStage,
    InterviewQuestion,
    InterviewSessionRuntime,
)


class OpenAIProvider(AIProvider):
    """Concrete provider adapter for an OpenAI-style API surface.

    The implementation is intentionally small and safe for this workspace:
    - It respects the configured API key.
    - It can run without the OpenAI SDK installed by using a local structured
      fallback strategy.
    - It emits typed interview plan/question objects so the planner remains
      provider-agnostic.
    """

    def __init__(self, api_key: str | None = None, model: str = "gpt-4o-mini") -> None:
        self.api_key = api_key or settings.ai_api_key or ""
        self.model = model

    def build_plan(self, configuration: InterviewConfiguration) -> InterviewPlan:
        if not self.api_key:
            return self._fallback_plan(configuration)

        try:
            # Optional SDK import is intentionally local so the backend can be
            # imported even when the OpenAI package is not installed.
            import openai  # type: ignore
        except Exception:
            return self._fallback_plan(configuration)

        try:
            system_prompt = self._system_prompt()
            user_prompt = self._planning_prompt(configuration)
            result = openai.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
            )
            raw = result.choices[0].message.content or "{}"
            payload = json.loads(raw)
            return InterviewPlan.model_validate(payload)
        except Exception:
            return self._fallback_plan(configuration)

    def generate_first_question(self, configuration: InterviewConfiguration, plan: InterviewPlan) -> InterviewQuestion:
        if not self.api_key:
            return self._fallback_question(configuration, plan)

        try:
            import openai  # type: ignore
        except Exception:
            return self._fallback_question(configuration, plan)

        try:
            system_prompt = self._question_system_prompt()
            user_prompt = self._question_prompt(configuration, plan)
            result = openai.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
            )
            raw = result.choices[0].message.content or "{}"
            payload = json.loads(raw)
            return InterviewQuestion.model_validate(payload)
        except Exception:
            return self._fallback_question(configuration, plan)

    def evaluate_answer(
        self,
        configuration: InterviewConfiguration,
        question: InterviewQuestion,
        candidate_answer: str,
        runtime: InterviewSessionRuntime | None = None,
    ) -> InterviewEvaluation:
        if not self.api_key:
            return self._fallback_evaluation(configuration, question, candidate_answer)

        try:
            import openai  # type: ignore
        except Exception:
            return self._fallback_evaluation(configuration, question, candidate_answer)

        try:
            system_prompt = self._evaluation_system_prompt()
            user_prompt = self._evaluation_prompt(configuration, question, candidate_answer)
            result = openai.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
            )
            raw = result.choices[0].message.content or "{}"
            payload = json.loads(raw)
            return InterviewEvaluation.model_validate(payload)
        except Exception:
            return self._fallback_evaluation(configuration, question, candidate_answer)

    def decide_next_action(
        self,
        configuration: InterviewConfiguration,
        interview_plan: InterviewPlan,
        current_question: InterviewQuestion | None,
        candidate_answer: str,
        evaluation: InterviewEvaluation,
        runtime: InterviewSessionRuntime | None = None,
    ) -> InterviewAdaptiveDecision:
        if not self.api_key:
            return self._fallback_decision(
                configuration,
                interview_plan,
                current_question,
                candidate_answer,
                evaluation,
                runtime,
            )

        try:
            import openai  # type: ignore
        except Exception:
            return self._fallback_decision(
                configuration,
                interview_plan,
                current_question,
                candidate_answer,
                evaluation,
                runtime,
            )

        try:
            system_prompt = self._adaptive_decision_system_prompt()
            user_prompt = self._adaptive_decision_prompt(
                configuration,
                interview_plan,
                current_question,
                candidate_answer,
                evaluation,
                runtime,
            )
            result = openai.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
            )
            raw = result.choices[0].message.content or "{}"
            payload = json.loads(raw)
            return InterviewAdaptiveDecision.model_validate(payload)
        except Exception:
            return self._fallback_decision(
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
        if not self.api_key:
            return self._fallback_next_question(
                configuration,
                interview_plan,
                current_question,
                candidate_answer,
                evaluation,
                decision,
                runtime,
            )

        try:
            import openai  # type: ignore
        except Exception:
            return self._fallback_next_question(
                configuration,
                interview_plan,
                current_question,
                candidate_answer,
                evaluation,
                decision,
                runtime,
            )

        try:
            system_prompt = self._next_question_system_prompt()
            user_prompt = self._next_question_prompt(
                configuration,
                interview_plan,
                current_question,
                candidate_answer,
                evaluation,
                decision,
                runtime,
            )
            result = openai.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
            )
            raw = result.choices[0].message.content or "{}"
            payload = json.loads(raw)
            return InterviewQuestion.model_validate(payload)
        except Exception:
            return self._fallback_next_question(
                configuration,
                interview_plan,
                current_question,
                candidate_answer,
                evaluation,
                decision,
                runtime,
            )

    def _fallback_plan(self, configuration: InterviewConfiguration) -> InterviewPlan:
        role = configuration.target_role or "the target role"
        interview_type = configuration.interview_type
        duration = int(configuration.duration)
        question_count = max(4, min(12, duration // 2 + 4))

        stages = [
            {"name": "Introduction", "focus": f"Understand {configuration.candidate_name}'s background and career signal"},
            {"name": "Role Alignment", "focus": f"Assess readiness for {role}"},
            {"name": "Technical Assessment", "focus": f"Validate {interview_type} depth and decision quality"},
            {"name": "Problem Solving", "focus": "Review structured reasoning and tradeoffs"},
        ]

        return InterviewPlan(
            goal=f"Assess {configuration.candidate_name} for the {role} track",
            stages=[InterviewPlanStage.model_validate(stage) for stage in stages],
            difficulty="adaptive",
            question_count=question_count,
        )

    def _fallback_question(self, configuration: InterviewConfiguration, plan: InterviewPlan) -> InterviewQuestion:
        question = (
            f"Let's begin by understanding your technical background. "
            f"Can you describe a project or experience that best demonstrates your readiness for the "
            f"{configuration.target_role} role?"
        )
        return InterviewQuestion(
            id=f"q-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            text=question,
            type=configuration.interview_type,
            difficulty=configuration.difficulty,
            curriculum_day=None,
            module=None,
            topic=None,
            learning_objective=None,
            question_type="open-ended",
        )

    def _fallback_evaluation(
        self,
        configuration: InterviewConfiguration,
        question: InterviewQuestion,
        candidate_answer: str,
    ) -> InterviewEvaluation:
        answer = candidate_answer.strip()
        length = max(1, len(answer.split()))
        score = min(100, 68 + min(20, length // 4) + (10 if "example" in answer.lower() or "because" in answer.lower() else 0))

        if configuration.experience_level == "beginner":
            assessment = "Developing"
            strengths = ["Explained the topic in simple terms", "Started with a relevant point"]
            weaknesses = ["Could add a more concrete example"]
            feedback = (
                "Your answer shows a good starting point. You can make it stronger by relating the concept to a real-world scenario "
                "and explaining why it matters in practice."
            )
        elif configuration.experience_level == "advanced":
            assessment = "Strong"
            strengths = ["Showed technical structure", "Connected the explanation to tradeoffs and constraints"]
            weaknesses = ["Could go deeper on edge cases or implementation detail"]
            feedback = (
                "Your answer is directionally strong and shows useful domain awareness. To raise it further, include edge cases, "
                "tradeoff reasoning, and a short implementation-oriented example."
            )
        else:
            assessment = "Solid"
            strengths = ["Relevant technical explanation", "Clear structure"]
            weaknesses = ["Could give a concrete example or practical detail"]
            feedback = (
                "You gave a relevant answer with good communication. It would be stronger with a concrete example and a little more depth "
                "around how the idea would be applied."
            )

        return InterviewEvaluation(
            questionId=question.id,
            score=score,
            assessment=assessment,
            strengths=strengths,
            weaknesses=weaknesses,
            feedback=feedback,
            technical_accuracy=round(min(1.0, score / 100.0), 2),
            depth=min(10, max(0, length // 10)),
            reasoning=(
                "The candidate provided a structured answer with examples and tradeoffs."
                if score >= 70
                else "The candidate's explanation lacks depth and concrete examples."
            ),
            clarity=round(min(1.0, 0.3 + min(0.7, length / 30.0)), 2),
            gaps=weaknesses,
            misconceptions=[],
            followup_needed=(score < 75),
        )

    def _fallback_decision(
        self,
        configuration: InterviewConfiguration,
        interview_plan: InterviewPlan,
        current_question: InterviewQuestion | None,
        candidate_answer: str,
        evaluation: InterviewEvaluation,
        runtime: InterviewSessionRuntime | None = None,
    ) -> InterviewAdaptiveDecision:
        score = evaluation.score
        stage = current_question.stage if current_question and getattr(current_question, "stage", None) else "technical"
        focus = "technical fundamentals"
        if score >= 80:
            action = "ask_question"
            difficulty = "hard"
            focus = "advanced role-specific tradeoffs"
            reason = "Candidate delivered a strong result; increase depth and difficulty."
            question_instruction = "Ask a deeper practical scenario probing tradeoffs and design decisions."
        elif 50 <= score < 80:
            action = "ask_question"
            difficulty = "medium"
            focus = "practical follow-up and evidence"
            reason = "Candidate gave a mid-range answer; keep the same level and ask for more precision."
            question_instruction = "Ask a follow-up that requires a concrete example and reasoning."
        else:
            action = "clarify_answer"
            difficulty = "easy"
            focus = "foundational concept validation"
            reason = "Candidate answer suggests a knowledge gap; adjust difficulty down and clarify."
            question_instruction = "Ask a simpler question that validates the missing concept directly."

        if runtime and runtime.question_history and len(runtime.question_history) >= int(interview_plan.question_count or 4):
            return InterviewAdaptiveDecision(
                action="finish_interview",
                stage=stage,
                difficulty="medium",
                focus="final review",
                reason="Question limit reached; finish the interview.",
                question_instruction="Finish the interview and provide final feedback.",
            )

        return InterviewAdaptiveDecision(
            action=action,
            stage=stage,
            difficulty=difficulty,
            focus=focus,
            reason=reason,
            question_instruction=question_instruction,
        )

    def _fallback_next_question(
        self,
        configuration: InterviewConfiguration,
        interview_plan: InterviewPlan,
        current_question: InterviewQuestion | None,
        candidate_answer: str,
        evaluation: InterviewEvaluation,
        decision: InterviewAdaptiveDecision,
        runtime: InterviewSessionRuntime | None = None,
    ) -> InterviewQuestion:
        suffix = current_question.text[:100] if current_question else "your background"
        if decision.action == "clarify_answer":
            text = (
                f"You mentioned {suffix}. Can you explain that idea in a simpler way and give one concrete example?"
            )
        elif decision.action == "move_to_next_stage":
            text = f"Now let's shift to the {decision.stage or 'next'} stage. What would be a strong execution plan for {configuration.target_role}?"
        elif decision.action == "finish_interview":
            text = "Thank you. The interview is complete."
        else:
            if decision.difficulty == "hard":
                text = (
                    f"Given your prior answer and score {evaluation.score}, walk through a more demanding scenario for "
                    f"{configuration.target_role}. What tradeoffs would you consider and why?"
                )
            elif decision.difficulty == "easy":
                text = (
                    f"Let’s revisit the basics. Describe what a {configuration.target_role} should understand about a small "
                    f"system or workflow in a clear, practical way."
                )
            else:
                text = (
                    f"Based on your last answer, what would you do in a practical {configuration.target_role} scenario to "
                    "show concrete reasoning and decision quality?"
                )

        # attempt to pick a curriculum day not yet covered
        curriculum_day = None
        try:
            days = runtime.covered_days if runtime else []
            all_days = []
            from app.services.curriculum_service import curriculum_service

            all_days = [d.get("day") for d in curriculum_service.all_days() if d.get("day")]
            for d in all_days:
                if d not in days:
                    curriculum_day = d
                    break
        except Exception:
            curriculum_day = None

        return InterviewQuestion(
            id=f"q-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}",
            text=text,
            type=configuration.interview_type,
            difficulty=decision.difficulty,
            stage=str(curriculum_day) if curriculum_day else decision.stage,
            curriculum_day=curriculum_day,
        )

    def _adaptive_decision_system_prompt(self) -> str:
        return (
            "You are an adaptive interview planning agent. Return strict JSON with an explicit action among "
            "ask_question, clarify_answer, move_to_next_stage, and finish_interview."
        )

    def _adaptive_decision_prompt(
        self,
        configuration: InterviewConfiguration,
        interview_plan: InterviewPlan,
        current_question: InterviewQuestion | None,
        candidate_answer: str,
        evaluation: InterviewEvaluation,
        runtime: InterviewSessionRuntime | None = None,
    ) -> str:
        return json.dumps(
            {
                "candidate": configuration.candidate_name,
                "target_role": configuration.target_role,
                "experience_level": configuration.experience_level,
                "interview_type": configuration.interview_type,
                "question_count": interview_plan.question_count,
                "current_question": current_question.model_dump(by_alias=False) if current_question else None,
                "candidate_answer": candidate_answer,
                "evaluation": evaluation.model_dump(by_alias=True),
                "previous_question_history": [q.model_dump(by_alias=False) for q in (runtime.question_history if runtime else [])],
            }
        )

    def _next_question_system_prompt(self) -> str:
        return "You generate the next interview question from the adaptive decision. Return strict JSON."

    def _next_question_prompt(
        self,
        configuration: InterviewConfiguration,
        interview_plan: InterviewPlan,
        current_question: InterviewQuestion | None,
        candidate_answer: str,
        evaluation: InterviewEvaluation,
        decision: InterviewAdaptiveDecision,
        runtime: InterviewSessionRuntime | None = None,
    ) -> str:
        return json.dumps(
            {
                "candidate": configuration.candidate_name,
                "target_role": configuration.target_role,
                "experience_level": configuration.experience_level,
                "interview_type": configuration.interview_type,
                "current_question": current_question.model_dump(by_alias=False) if current_question else None,
                "candidate_answer": candidate_answer,
                "evaluation": evaluation.model_dump(by_alias=True),
                "adaptive_decision": decision.model_dump(by_alias=True),
                "question_count": interview_plan.question_count,
                "question_history": [q.model_dump(by_alias=False) for q in (runtime.question_history if runtime else [])],
            }
        )

    def _system_prompt(self) -> str:
        return (
            "You are an interview planning agent. "
            "Return strict JSON matching the domain model fields."
        )

    def _planning_prompt(self, configuration: InterviewConfiguration) -> str:
        return json.dumps(
            {
                "goal": f"Assess {configuration.candidate_name} for {configuration.target_role}",
                "candidate": configuration.candidate_name,
                "target_role": configuration.target_role,
                "experience_level": configuration.experience_level,
                "interview_type": configuration.interview_type,
                "difficulty": configuration.difficulty,
                "duration": configuration.duration,
            }
        )

    def _question_system_prompt(self) -> str:
        return "You are a concise interview question generator. Return strict JSON."

    def _question_prompt(self, configuration: InterviewConfiguration, plan: InterviewPlan) -> str:
        return json.dumps(
            {
                "candidate": configuration.candidate_name,
                "target_role": configuration.target_role,
                "interview_type": configuration.interview_type,
                "goal": plan.goal,
                "question_count": plan.question_count,
            }
        )

    def _evaluation_system_prompt(self) -> str:
        return (
            "You are a structured interview answer evaluator. Evaluate a candidate answer against the role context, "
            "experience level, clarity, correctness, relevance, and completeness. Return strict JSON."
        )

    def _evaluation_prompt(self, configuration: InterviewConfiguration, question: InterviewQuestion, candidate_answer: str) -> str:
        return json.dumps(
            {
                "candidate": configuration.candidate_name,
                "target_role": configuration.target_role,
                "experience_level": configuration.experience_level,
                "question_id": question.id,
                "question_text": question.text,
                "question_type": question.type,
                "question_difficulty": question.difficulty,
                "candidate_answer": candidate_answer,
            }
        )
