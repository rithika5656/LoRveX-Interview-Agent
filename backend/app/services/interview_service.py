from datetime import datetime, timezone
from typing import Dict
from uuid import uuid4

from app.agents.adaptive_interview_planner import AdaptiveInterviewPlannerAgent
from app.agents.answer_evaluator import AnswerEvaluatorAgent
from app.agents.interview_planner import InterviewPlannerAgent
from app.core.errors import duplicate_answer, empty_answer, invalid_question, invalid_session, interview_not_started
from app.schemas.interview import (
    InterviewAnswer,
    InterviewAnswerNextState,
    InterviewAnswerSubmissionRequest,
    InterviewAnswerSubmissionResponse,
    InterviewConfiguration,
    InterviewCreateRequest,
    InterviewCreateResponse,
    InterviewEvaluation,
    InterviewSessionRuntime,
    InterviewStartResponse,
)


class InterviewService:
    def __init__(self) -> None:
        self._sessions: Dict[str, InterviewCreateResponse] = {}
        self._runtimes: Dict[str, InterviewSessionRuntime] = {}
        self._created_at: Dict[str, datetime] = {}
        self._planner = InterviewPlannerAgent()
        self._evaluator = AnswerEvaluatorAgent()
        self._adaptive_planner = AdaptiveInterviewPlannerAgent()

    def create_session(self, configuration: InterviewCreateRequest) -> InterviewCreateResponse:
        session_id = uuid4().hex
        response = InterviewCreateResponse(sessionId=session_id, configuration=configuration)
        self._sessions[session_id] = response
        # build initial candidate profile if available
        from app.services.candidate_service import candidate_service

        candidate_profile = candidate_service.build_learning_profile(configuration.candidate_name)

        self._runtimes[session_id] = InterviewSessionRuntime(
            sessionId=session_id,
            status="created",
            configuration=configuration,
            interviewPlan=None,
            currentStage="technical",
            currentDifficulty=configuration.difficulty,
            currentQuestion=None,
            questionHistory=[],
            answerHistory=[],
            evaluations=[],
            adaptiveDecisions=[],
            candidateProfile=candidate_profile,
            coveredDays=[],
        )
        self._created_at[session_id] = datetime.now(timezone.utc)
        return response

    def get_session(self, session_id: str) -> InterviewCreateResponse:
        session = self._sessions.get(session_id)
        if session is None:
            raise invalid_session()

        return session

    def start_interview(self, session_id: str) -> InterviewStartResponse:
        session = self.get_session(session_id)
        configuration = self._configuration_from_session(session)
        plan = self._planner.create_plan(configuration)
        question = self._planner.generate_first_question(configuration, plan)

        runtime = self._runtimes.get(session_id)
        if runtime is None:
            from app.services.candidate_service import candidate_service

            candidate_profile = candidate_service.build_learning_profile(configuration.candidate_name)

            runtime = InterviewSessionRuntime(
                sessionId=session_id,
                status="created",
                configuration=configuration,
                interviewPlan=None,
                currentStage="technical",
                currentDifficulty=configuration.difficulty,
                currentQuestion=None,
                questionHistory=[],
                answerHistory=[],
                evaluations=[],
                adaptiveDecisions=[],
                candidateProfile=candidate_profile,
                coveredDays=[],
            )
            self._runtimes[session_id] = runtime

        # ensure candidate_profile present
        if getattr(runtime, "candidate_profile", None) is None:
            from app.services.candidate_service import candidate_service

            runtime.candidate_profile = candidate_service.build_learning_profile(configuration.candidate_name)

        runtime.status = "started"
        runtime.interview_plan = plan
        runtime.current_stage = "technical"
        runtime.current_difficulty = configuration.difficulty
        runtime.current_question = question
        runtime.question_history = [question]

        # record initial question's curriculum day if present
        try:
            if question and getattr(question, "curriculum_day", None):
                cd = int(question.curriculum_day)
                if cd not in runtime.covered_days:
                    runtime.covered_days.append(cd)
        except Exception:
            pass

        return InterviewStartResponse(
            sessionId=session_id,
            status="started",
            plan=plan,
            question=question,
        )

    def submit_answer(self, session_id: str, payload: InterviewAnswerSubmissionRequest) -> InterviewAnswerSubmissionResponse:
        session = self.get_session(session_id)
        runtime = self._runtimes.get(session_id)
        if runtime is None or runtime.status == "created":
            raise interview_not_started()

        if runtime.current_question is None:
            raise interview_not_started()

        existing_answers = [item for item in runtime.answer_history if item.question_id == payload.question_id]
        if existing_answers:
            raise duplicate_answer()

        if payload.question_id != runtime.current_question.id:
            raise invalid_question()

        if not payload.answer or not payload.answer.strip():
            raise empty_answer()

        configuration = self._configuration_from_session(session)
        plan = runtime.interview_plan or self._planner.create_plan(configuration)
        evaluation = self._evaluator.evaluate_answer(
            configuration,
            runtime.current_question,
            payload.answer,
            runtime,
        )

        answer = InterviewAnswer(
            questionId=payload.question_id,
            text=payload.answer.strip(),
            submitted_at=datetime.now(timezone.utc).isoformat(),
        )

        runtime.answer_history.append(answer)
        runtime.evaluations.append(evaluation)
        runtime.status = "answered"

        decision = self._adaptive_planner.decide_next_action(
            configuration,
            plan,
            runtime.current_question,
            payload.answer,
            evaluation,
            runtime,
        )

        runtime.adaptive_decisions.append(decision)

        # update covered_days using curriculum_day metadata or numeric stage
        try:
            day_n = None
            if runtime.current_question and getattr(runtime.current_question, "curriculum_day", None):
                day_n = int(runtime.current_question.curriculum_day)
            else:
                stage = runtime.current_question.stage if runtime.current_question else None
                day_n = int(stage) if stage and str(stage).isdigit() else None

            if day_n:
                if day_n not in runtime.covered_days:
                    runtime.covered_days.append(day_n)
        except Exception:
            pass

        # only finish when sufficient questions AND curriculum days covered
        got_qs = len(runtime.question_history)
        got_days = len(runtime.covered_days)
        required_qs = int(plan.question_count or 8)
        if got_qs >= required_qs and got_days >= 4:
            decision.action = "finish_interview"

        if decision.action == "finish_interview":
            runtime.status = "completed"
            runtime.current_question = None
            runtime.current_stage = runtime.current_stage or "technical"
            next_state = InterviewAnswerNextState(action="finish_interview")
        else:
            runtime.current_stage = decision.stage or runtime.current_stage
            runtime.current_difficulty = decision.difficulty or runtime.current_difficulty

            next_question = self._adaptive_planner.generate_next_question(
                configuration,
                plan,
                runtime.current_question,
                payload.answer,
                evaluation,
                decision,
                runtime,
            )

            if decision.action == "move_to_next_stage":
                runtime.current_stage = next_question.stage or decision.stage or runtime.current_stage

            runtime.current_question = next_question
            runtime.question_history.append(next_question)
            # also record curriculum day for the next question if present
            try:
                if getattr(next_question, "curriculum_day", None):
                    cd = int(next_question.curriculum_day)
                    if cd not in runtime.covered_days:
                        runtime.covered_days.append(cd)
            except Exception:
                pass
            runtime.current_difficulty = next_question.difficulty or runtime.current_difficulty

            next_state = InterviewAnswerNextState(
                action=decision.action,
                stage=decision.stage,
                difficulty=decision.difficulty,
                focus=decision.focus,
                reason=decision.reason,
                question=next_question,
            )

        # finalize only when both question and curriculum day thresholds are satisfied
        got_qs = len(runtime.question_history)
        got_days = len(runtime.covered_days)
        required_qs = int(plan.question_count or 8)
        if got_qs >= required_qs and got_days >= 4 and next_state.action != "finish_interview":
            runtime.status = "completed"
            runtime.current_question = None
            next_state = InterviewAnswerNextState(action="finish_interview")

        return InterviewAnswerSubmissionResponse(
            questionId=payload.question_id,
            evaluation=evaluation,
            next=next_state,
        )

    def _configuration_from_session(self, session: InterviewCreateResponse) -> InterviewConfiguration:
        config = session.configuration
        if not isinstance(config, InterviewConfiguration):
            return InterviewConfiguration.model_validate(config.model_dump(by_alias=True))
        return config
