from __future__ import annotations

from typing import List

from app.ai.openai_provider import OpenAIProvider
from app.ai.provider import AIProvider
from app.core.config import settings
from app.schemas.interview import InterviewConfiguration, InterviewPlan, InterviewPlanStage
from app.services.curriculum_service import curriculum_service
from app.services.candidate_service import candidate_service
import logging

logger = logging.getLogger(__name__)


class InterviewPlannerAgent:
    def __init__(self, provider: AIProvider | None = None) -> None:
        self.provider = provider or OpenAIProvider(api_key=settings.ai_api_key)

    def create_plan(self, configuration: InterviewConfiguration) -> InterviewPlan:
        # Build a personalized plan using curriculum and candidate profile
        profile = candidate_service.build_learning_profile(configuration.candidate_name)

        all_days = curriculum_service.all_days()
        # choose recommended or least-covered days
        chosen_days: List[int] = []
        if profile:
            recommended = profile.get("recommended_topics", [])
            for d in recommended:
                if d not in chosen_days:
                    chosen_days.append(d)
                if len(chosen_days) >= 6:
                    break

        # fill from curriculum if insufficient
        if len(chosen_days) < 4:
            for d in all_days:
                day_n = d.get("day")
                if day_n and day_n not in chosen_days:
                    chosen_days.append(day_n)
                if len(chosen_days) >= 4:
                    break

        question_count = max(8, int(configuration.duration) // 2 + 4)

        # stages: map first modules into plan stages
        stages: List[InterviewPlanStage] = []
        for m in curriculum_service.all_modules()[:4]:
            stages.append(
                InterviewPlanStage(name=m.get("title", "Module"), focus=m.get("description") or m.get("title", "Module"))
            )

        goal = f"Assess {configuration.candidate_name} for {configuration.target_role} with curriculum focus days {chosen_days[:4]}"

        plan = InterviewPlan(
            goal=goal,
            stages=stages,
            difficulty=configuration.difficulty,
            questionCount=question_count,
        )

        # attach recommended days as metadata (non-validated extra) by returning plan
        return plan

    def generate_first_question(self, configuration: InterviewConfiguration, plan: InterviewPlan):
        # Delegate to provider for a well-formed question but bias by curriculum
        try:
            q = self.provider.generate_first_question(configuration, plan)
        except Exception:
            from app.schemas.interview import InterviewQuestion

            q = InterviewQuestion(
                id="q-1",
                text=f"Tell me about a project that demonstrates your readiness for {configuration.target_role}.",
                type=configuration.interview_type,
                difficulty=configuration.difficulty,
            )

        # attempt to attach curriculum metadata: prefer recommended topics from candidate profile
        try:
            profile = candidate_service.build_learning_profile(configuration.candidate_name)
            recommended = profile.get("recommended_topics", []) if profile else []
            chosen_day = None
            if recommended:
                chosen_day = recommended[0]
            else:
                all_days = curriculum_service.all_days()
                if all_days:
                    first = all_days[0]
                    chosen_day = first.get("day")

            logger.debug("planner chosen_day: %s", chosen_day)

            if chosen_day:
                try:
                    day_n = int(chosen_day)
                    q.curriculum_day = day_n
                    q.stage = str(day_n)
                    day_info = curriculum_service.get_day(day_n)
                    if day_info:
                        q.topic = day_info.get("title")
                        objs = day_info.get("objectives", [])
                        if objs:
                            q.learning_objective = objs[0]
                    for mod in curriculum_service.all_modules():
                        if day_n in mod.get("days", []):
                            q.module = mod.get("title")
                            break
                    q.question_type = "conceptual"
                except Exception as e:
                    logger.debug("planner failed to set curriculum metadata: %s", e)
        except Exception as e:
            logger.exception("exception while attaching curriculum metadata")
            pass

        return q
