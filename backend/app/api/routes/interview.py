from __future__ import annotations

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Any, Dict

from app.services.interview_service import InterviewService
from app.agents.feedback_agent import FeedbackAgent

router = APIRouter()


class InterviewPayloadStart(BaseModel):
    sessionId: str
    candidate: Dict[str, Any]


class InterviewPayloadContinue(BaseModel):
    sessionId: str
    message: str


def get_interview_service(request: Request) -> InterviewService:
    return request.app.state.interview_service


@router.options("/interview")
def interview_options_endpoint():
    return {}


@router.post("/interview")
def interview_endpoint(payload: Dict[str, Any], request: Request):
    """Single endpoint for starting and continuing interviews per technical-spec.md"""
    svc = get_interview_service(request)

    # Start
    if "candidate" in payload:
        data = InterviewPayloadStart.model_validate(payload)
        session_id = data.sessionId
        candidate = data.candidate

        # create a minimal configuration from candidate info
        member = candidate.get("member", {})
        candidate_name = member.get("name") or "Candidate"
        target_role = member.get("jobRole") or "Candidate Role"
        years = member.get("yearsExperience") or 0
        if years < 2:
            experience = "beginner"
        elif years < 6:
            experience = "intermediate"
        else:
            experience = "advanced"

        # build a create request model dict to pass through InterviewService
        create_payload = {
            "candidateName": candidate_name,
            "targetRole": target_role,
            "experienceLevel": experience,
            "interviewType": "technical",
            "difficulty": "adaptive",
            "duration": 30,
        }

        # create session with the provided sessionId if not exists
        # InterviewService.create_session generates its own sessionId, so we'll create then remap to client-provided id
        try:
            # build InterviewCreateRequest via direct model import to validate
            from app.schemas.interview import InterviewCreateRequest

            cfg = InterviewCreateRequest.model_validate(create_payload)
            created = svc.create_session(cfg)
            # replace stored session id with provided one (allow client to supply id)
            # copy runtime and responses under new session id
            if session_id != created.session_id:
                # move entries
                svc._sessions[session_id] = svc._sessions.pop(created.session_id)
                # set both alias and attribute names when possible
                try:
                    svc._sessions[session_id].session_id = session_id
                except Exception:
                    pass
                try:
                    svc._sessions[session_id].sessionId = session_id
                except Exception:
                    pass
                svc._runtimes[session_id] = svc._runtimes.pop(created.session_id)
                try:
                    svc._runtimes[session_id].session_id = session_id
                except Exception:
                    pass
                try:
                    svc._runtimes[session_id].sessionId = session_id
                except Exception:
                    pass
        except Exception:
            # fallback: create a session normally
            pass

        # start the interview
        try:
            start_resp = svc.start_interview(session_id)
        except Exception:
            # attempt to start using the created session if overwrote failed
            # find any session matching candidate name
            # fallback: get any session
            keys = list(svc._sessions.keys())
            if keys:
                sid = keys[0]
                start_resp = svc.start_interview(sid)
            else:
                raise HTTPException(status_code=500, detail="unable to create interview session")

        runtime = svc._runtimes.get(session_id)
        covered_days = runtime.covered_days if runtime else []

        return {
            "reply": "Welcome. Let's begin your interview.",
            "done": False,
            "question": start_resp.question.model_dump(by_alias=True),
            "plan": start_resp.plan.model_dump(by_alias=True),
            "coveredDays": covered_days,
        }

    # Continue
    if "message" in payload:
        data = InterviewPayloadContinue.model_validate(payload)
        session_id = data.sessionId
        message = data.message

        # Submit the candidate's answer using the InterviewService
        runtime = svc._runtimes.get(session_id)
        if not runtime:
            raise HTTPException(status_code=404, detail="session not found")

        current_q = runtime.current_question
        if not current_q:
            raise HTTPException(status_code=400, detail="no active question")

        from app.schemas.interview import InterviewAnswerSubmissionRequest

        ans_payload = InterviewAnswerSubmissionRequest.model_validate({"questionId": current_q.id, "answer": message})
        result = svc.submit_answer(session_id, ans_payload)

        # if interview completed, generate feedback
        done = False
        feedback = None
        if runtime.status == "completed":
            done = True
            feedback_agent = FeedbackAgent()
            feedback = feedback_agent.generate_feedback(runtime)
            return {
                "reply": "Interview completed.",
                "done": True,
                "feedback": feedback.model_dump(by_alias=True),
                "next": result.next.model_dump(by_alias=True) if result.next else None,
                "coveredDays": runtime.covered_days,
            }

        # otherwise return next question text
        next_state = result.next
        next_q = next_state.question
        reply = next_q.text if next_q else "Thank you."
        return {
            "reply": reply,
            "done": False,
            "next": next_state.model_dump(by_alias=True) if next_state else None,
            "question": next_q.model_dump(by_alias=True) if next_q else None,
            "coveredDays": runtime.covered_days,
        }

    raise HTTPException(status_code=400, detail="invalid payload")
