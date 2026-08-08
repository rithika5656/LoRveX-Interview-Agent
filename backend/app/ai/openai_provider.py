from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from app.ai.provider import AIProvider
from app.core.config import settings
from app.schemas.interview import InterviewConfiguration, InterviewPlan, InterviewPlanStage, InterviewQuestion


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
