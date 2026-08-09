from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

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
            id=f"q-{uuid4().hex[:12]}",
            text=question,
            type=configuration.interview_type,
            difficulty=configuration.difficulty,
            curriculum_day=1,
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
        answer_lower = answer.lower()
        length = max(1, len(answer.split()))
        score = min(100, 68 + min(20, length // 4) + (10 if "example" in answer_lower or "because" in answer_lower else 0))

        # Check for technical misconceptions (e.g. claiming RAG completely eliminates hallucinations)
        misconceptions = []
        if ("rag" in answer_lower or "retrieval" in answer_lower) and ("eliminate" in answer_lower or "100%" in answer_lower or "never" in answer_lower or "completely" in answer_lower) and "hallucinat" in answer_lower:
            misconceptions.append("Claimed RAG completely eliminates hallucinations")
            score = min(score, 62)

        # Detect technical claims & concepts in answer
        detected_claims = []
        keywords = ["vector", "embedding", "rag", "mcp", "agent", "chunking", "rerank", "prompt", "fine-tuning", "hallucinat", "context window", "tool calling"]
        for kw in keywords:
            if kw in answer_lower:
                detected_claims.append(kw)

        if configuration.experience_level == "beginner":
            assessment = "Developing" if score < 75 else "Solid"
            strengths = ["Explained the concept clearly", "Started with a relevant baseline point"]
            weaknesses = ["Could ground reasoning with concrete production tradeoffs"]
            feedback = (
                "Your answer shows a good starting point. You can make it stronger by relating the concept to a real-world scenario "
                "and explaining why it matters in practice."
            )
        elif configuration.experience_level == "advanced":
            assessment = "Strong" if score >= 80 else "Solid"
            strengths = ["Showed technical structure", "Connected the explanation to tradeoffs and constraints"]
            weaknesses = ["Could go deeper on edge cases or implementation detail"]
            feedback = (
                "Your answer is directionally strong and shows useful domain awareness. To raise it further, include edge cases, "
                "tradeoff reasoning, and a short implementation-oriented example."
            )
        else:
            assessment = "Solid" if score >= 70 else "Developing"
            strengths = ["Relevant technical explanation", "Clear structure"]
            weaknesses = ["Could give a concrete example or practical detail"]
            feedback = (
                "You gave a relevant answer with good communication. It would be stronger with a concrete example and a little more depth "
                "around how the idea would be applied."
            )

        if misconceptions:
            weaknesses.insert(0, misconceptions[0])

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
                f"Candidate addressed '{question.topic or question.stage}' addressing key terms ({', '.join(detected_claims[:3]) if detected_claims else 'general concept'})."
                if score >= 70
                else f"Candidate explanation lacks depth or contains potential misconceptions ({', '.join(misconceptions)})."
            ),
            clarity=round(min(1.0, 0.3 + min(0.7, length / 30.0)), 2),
            gaps=weaknesses,
            misconceptions=misconceptions,
            followup_needed=(score < 75 or len(misconceptions) > 0),
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
        
        # Check misconception first
        if evaluation.misconceptions:
            action = "clarify_answer"
            difficulty = "medium"
            focus = "misconception check & limitations"
            reason = f"Candidate made technical claim '{evaluation.misconceptions[0]}'; probe limitations directly."
            question_instruction = "Ask a misconception-check follow-up probing system limitations and failure modes."
        elif score >= 80:
            action = "ask_question"
            difficulty = "hard"
            focus = "advanced role-specific tradeoffs and architecture"
            reason = "Candidate delivered a strong result; increase technical depth and difficulty."
            question_instruction = "Ask a deeper practical scenario probing architecture, tradeoffs, and production considerations."
        elif 50 <= score < 80:
            action = "ask_question"
            difficulty = "medium"
            focus = "practical follow-up and edge case handling"
            reason = "Candidate gave a mid-range answer; maintain level and ask for technical precision."
            question_instruction = "Ask a follow-up requiring concrete implementation details and edge case reasoning."
        else:
            action = "clarify_answer"
            difficulty = "easy"
            focus = "foundational concept validation"
            reason = "Candidate answer suggests a knowledge gap; adjust difficulty down and clarify."
            question_instruction = "Ask a simpler question that validates the missing concept directly."

        got_qs = len(runtime.question_history) if runtime and runtime.question_history else 0
        got_days = len(set(runtime.covered_days)) if runtime and runtime.covered_days else 0
        req_qs = int(interview_plan.question_count or 8) if (interview_plan and getattr(interview_plan, "question_count", None)) else 8

        if got_qs >= req_qs and got_days >= 4:
            return InterviewAdaptiveDecision(
                action="finish_interview",
                stage=stage,
                difficulty="medium",
                focus="final review",
                reason="Question limit and curriculum day requirement reached; finish the interview.",
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
        # extract key technical terms or claims from candidate_answer if present
        clean_ans = candidate_answer.strip()
        clean_ans_lower = clean_ans.lower()
        key_term = ""
        domain_terms = ["embeddings", "vector search", "vector database", "rag", "retrieval", "mcp", "agent", "chunking", "reranking", "prompting", "hallucination"]
        for dt in domain_terms:
            if dt in clean_ans_lower:
                key_term = dt
                break

        if not key_term:
            for word in clean_ans.split():
                w = word.strip(",.!?()[]\"'")
                if len(w) > 4 and w.lower() not in {"would", "could", "should", "about", "there", "their", "where", "which", "these", "those", "other", "using", "first"}:
                    key_term = w
                    break

        # Select curriculum day not yet covered if possible
        curriculum_day = None
        try:
            days = runtime.covered_days if runtime else []
            from app.services.curriculum_service import curriculum_service

            all_days = [d.get("day") for d in curriculum_service.all_days() if d.get("day")]
            for d in all_days:
                if d not in days:
                    curriculum_day = d
                    break
        except Exception:
            curriculum_day = None

        if not curriculum_day:
            curriculum_day = (runtime.covered_days[-1] % 31) + 1 if (runtime and runtime.covered_days) else 1

        # Fetch curriculum day info for seamless transition
        day_info = None
        module_title = None
        topic_title = None
        learning_obj = None
        try:
            from app.services.curriculum_service import curriculum_service
            day_info = curriculum_service.get_day(curriculum_day)
            if day_info:
                topic_title = day_info.get("title")
                objs = day_info.get("objectives", [])
                if objs:
                    learning_obj = objs[0]
            for mod in curriculum_service.all_modules():
                if curriculum_day in mod.get("days", []):
                    module_title = mod.get("title")
                    break
        except Exception:
            pass

        # Determine question mode diversity
        history_len = len(runtime.question_history) if runtime else 0
        modes = ["conceptual", "architecture", "debugging", "tradeoff", "scenario", "engineering_decision", "followup", "reflection"]
        question_type = modes[history_len % len(modes)]

        # Generate contextual question text based on decision, claims, and topic
        if decision.action == "clarify_answer":
            if evaluation.misconceptions:
                text = f"You mentioned that '{evaluation.misconceptions[0]}'. What limitations or edge cases can still cause a system to produce an incorrect answer?"
                question_type = "debugging"
            elif key_term:
                text = f"You mentioned '{key_term}'. How would you handle a case where the retrieved results are semantically similar but don't actually contain the answer?"
                question_type = "followup"
            else:
                text = f"Could you clarify the core reasoning behind your previous response and give one concrete example?"
                question_type = "conceptual"
        elif decision.action == "finish_interview":
            text = "Thank you. The interview is complete."
        else:
            if decision.difficulty == "hard":
                question_type = "architecture" if history_len % 2 == 0 else "tradeoff"
                if key_term:
                    text = f"Building on your mention of '{key_term}', how would you design a production-grade enterprise system around {topic_title or key_term}? What latency and accuracy trade-offs would you make?"
                else:
                    text = f"Given your explanation on {topic_title or 'system design'}, how would you architect this for high concurrency and zero data leakage in production?"
            elif decision.difficulty == "easy":
                question_type = "conceptual"
                text = f"Let's step back to the fundamentals of Day {curriculum_day} ({topic_title or 'this topic'}). How would you explain {learning_obj or 'its core purpose'} to a team member?"
            else:
                question_type = "scenario" if history_len % 2 == 1 else "engineering_decision"
                if key_term:
                    text = f"You mentioned '{key_term}'. In a production environment covering {topic_title or 'this module'}, how would you monitor and debug failures when this component underperforms?"
                else:
                    text = f"Moving to Day {curriculum_day} ({topic_title or 'next topic'}), what engineering decision would you make when balancing retrieval accuracy versus latency?"

        return InterviewQuestion(
            id=f"q-{uuid4().hex[:12]}",
            text=text,
            type=configuration.interview_type,
            difficulty=decision.difficulty,
            stage=str(curriculum_day) if curriculum_day else decision.stage,
            curriculum_day=curriculum_day,
            module=module_title,
            topic=topic_title,
            learning_objective=learning_obj,
            question_type=question_type,
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
