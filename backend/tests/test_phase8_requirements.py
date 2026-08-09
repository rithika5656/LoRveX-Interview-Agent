from fastapi.testclient import TestClient

from app.main import app
from app.agents.feedback_agent import FeedbackAgent
from app.schemas.interview import InterviewCreateRequest
from app.services.curriculum_service import curriculum_service

client = TestClient(app)


def create_session() -> str:
    payload = InterviewCreateRequest.model_validate(
        {
            "candidateName": "Phase8 Candidate",
            "targetRole": "fullstack-engineer",
            "experienceLevel": "intermediate",
            "interviewType": "technical",
            "difficulty": "adaptive",
            "duration": 30,
        }
    )
    response = client.post("/api/interviews", json=payload.model_dump(by_alias=True))
    assert response.status_code == 200
    return response.json()["sessionId"]


def test_phase8_min_questions_and_days_and_feedback():
    session_id = create_session()

    start_response = client.post(f"/api/interviews/{session_id}/start")
    assert start_response.status_code == 200

    print("ALL DAYS:", curriculum_service.all_days()[:3])

    question = start_response.json()["question"]
    print("START QUESTION:", question)
    qid = question["id"]

    # keep answering until finished or max attempts
    max_loops = 20
    next_qid = qid
    finished = False
    for _ in range(max_loops):
        ans_resp = client.post(
            f"/api/interviews/{session_id}/answer",
            json={"questionId": next_qid, "answer": "I would explain tradeoffs and provide an example."},
        )
        # sometimes the runtime may have advanced or de-duped; sync to current question
        if ans_resp.status_code != 200:
            # try to recover current question id from runtime
            runtime = app.state.interview_service._runtimes.get(session_id)
            assert runtime is not None
            if runtime.current_question:
                next_qid = runtime.current_question.id
                continue
            else:
                ans_resp.raise_for_status()

        body = ans_resp.json()
        nxt = body.get("next", {})
        if nxt.get("action") == "finish_interview":
            finished = True
            break
        next_question = nxt.get("question")
        assert next_question is not None
        next_qid = next_question["id"]

    assert finished is True

    # inspect runtime for counts
    runtime = app.state.interview_service._runtimes.get(session_id)
    assert runtime is not None
    assert len(runtime.question_history) >= 8
    assert len(set(runtime.covered_days)) >= 4

    # generate feedback and assert structure
    feedback_agent = FeedbackAgent()
    feedback = feedback_agent.generate_feedback(runtime)
    assert hasattr(feedback, "overall_score")
    assert hasattr(feedback, "interview_summary")
    assert isinstance(feedback.recommendations, list)
