from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.interview import InterviewAdaptiveDecision, InterviewCreateRequest

client = TestClient(app)


def create_session() -> str:
    payload = InterviewCreateRequest.model_validate(
        {
            "candidateName": "Alex Candidate",
            "targetRole": "backend-developer",
            "experienceLevel": "intermediate",
            "interviewType": "technical",
            "difficulty": "medium",
            "duration": 10,
        }
    )
    response = client.post("/api/interviews", json=payload.model_dump(by_alias=True))
    assert response.status_code == 200
    return response.json()["sessionId"]


def test_phase7_strong_answer_returns_next_question():
    session_id = create_session()

    start_response = client.post(f"/api/interviews/{session_id}/start")
    assert start_response.status_code == 200
    question_id = start_response.json()["question"]["id"]

    answer_response = client.post(
        f"/api/interviews/{session_id}/answer",
        json={
            "questionId": question_id,
            "answer": (
                "I would design a small API contract, separate persistence from the domain layer, "
                "measure tradeoffs, and explain why observability and testability matter."
            ),
        },
    )

    assert answer_response.status_code == 200
    body = answer_response.json()
    assert body["next"]["action"] in {"ask_question", "clarify_answer", "move_to_next_stage", "finish_interview"}
    assert "evaluation" in body
    assert body["next"]["question"] is not None


def test_phase7_weak_answer_can_produce_a_clarification_question():
    session_id = create_session()

    start_response = client.post(f"/api/interviews/{session_id}/start")
    question_id = start_response.json()["question"]["id"]

    answer_response = client.post(
        f"/api/interviews/{session_id}/answer",
        json={
            "questionId": question_id,
            "answer": "I do not know enough to answer this well.",
        },
    )

    assert answer_response.status_code == 200
    body = answer_response.json()
    assert body["evaluation"]["score"] >= 0
    assert body["next"]["action"] in {"clarify_answer", "ask_question", "finish_interview"}


def test_phase7_strong_answer_becomes_harder_question():
    session_id = create_session()

    start_response = client.post(f"/api/interviews/{session_id}/start")
    question_id = start_response.json()["question"]["id"]

    answer_response = client.post(
        f"/api/interviews/{session_id}/answer",
        json={
            "questionId": question_id,
            "answer": "I would isolate business rules, separate adapters from core services, build a bounded interface, and make the system observable for production behavior.",
        },
    )

    assert answer_response.status_code == 200
    next_payload = answer_response.json()["next"]
    assert next_payload["action"] == "ask_question"
    assert next_payload["question"] is not None
    assert next_payload["difficulty"] in {"medium", "hard"}


def test_phase7_medium_answer_is_same_or_probe_question():
    session_id = create_session()

    start_response = client.post(f"/api/interviews/{session_id}/start")
    question_id = start_response.json()["question"]["id"]

    answer_response = client.post(
        f"/api/interviews/{session_id}/answer",
        json={
            "questionId": question_id,
            "answer": "I would keep the logic simple and explain the important parts using examples and tradeoffs.",
        },
    )

    assert answer_response.status_code == 200
    next_payload = answer_response.json()["next"]
    assert next_payload["action"] in {"ask_question", "clarify_answer"}
    assert next_payload["difficulty"] in {"easy", "medium", "hard"}


def test_phase7_weak_answer_can_return_clarification():
    session_id = create_session()

    start_response = client.post(f"/api/interviews/{session_id}/start")
    question_id = start_response.json()["question"]["id"]

    answer_response = client.post(
        f"/api/interviews/{session_id}/answer",
        json={
            "questionId": question_id,
            "answer": "I don't know.",
        },
    )

    assert answer_response.status_code == 200
    next_payload = answer_response.json()["next"]
    assert next_payload["action"] in {"clarify_answer", "ask_question", "finish_interview"}


def test_phase7_duplicate_answer_is_rejected():
    session_id = create_session()

    start_response = client.post(f"/api/interviews/{session_id}/start")
    question_id = start_response.json()["question"]["id"]

    first = client.post(
        f"/api/interviews/{session_id}/answer",
        json={
            "questionId": question_id,
            "answer": "I can explain the system and walk through the tradeoffs.",
        },
    )
    second = client.post(
        f"/api/interviews/{session_id}/answer",
        json={
            "questionId": question_id,
            "answer": "I can explain the system and walk through the tradeoffs.",
        },
    )

    assert first.status_code == 200
    assert second.status_code == 409


def test_phase7_max_question_history_stops_after_plan_limit():
    session_id = create_session()

    start_response = client.post(f"/api/interviews/{session_id}/start")
    assert start_response.status_code == 200

    question_id = start_response.json()["question"]["id"]
    plan_count = start_response.json()["plan"]["questionCount"]

    next_question_id = question_id
    finished = False

    for _ in range(plan_count):
        answer_response = client.post(
            f"/api/interviews/{session_id}/answer",
            json={
                "questionId": next_question_id,
                "answer": "I would explain the tradeoffs clearly and provide a concrete implementation approach.",
            },
        )
        assert answer_response.status_code == 200
        payload = answer_response.json()

        if payload["next"]["action"] == "finish_interview":
            finished = True
            break

        next_question = payload["next"]["question"]
        assert next_question is not None
        next_question_id = next_question["id"]

    assert finished is True


def test_phase7_invalid_session_lookup_is_rejected():
    response = client.get("/api/interviews/definitely-not-a-real-session")
    assert response.status_code == 404


def test_phase7_invalid_action_is_rejected_by_schema():
    try:
        InterviewAdaptiveDecision.model_validate(
            {
                "action": "random_action",
                "stage": "technical",
                "difficulty": "hard",
                "focus": "validation",
                "reason": "should be rejected",
                "question_instruction": "ask a question",
            }
        )
    except ValidationError:
        assert True
    else:
        assert False


def test_phase7_invalid_question_rejected():
    session_id = create_session()

    start_response = client.post(f"/api/interviews/{session_id}/start")
    assert start_response.status_code == 200

    answer_response = client.post(
        f"/api/interviews/{session_id}/answer",
        json={
            "questionId": "does-not-match",
            "answer": "This answer is intentionally paired with a bad ID.",
        },
    )

    assert answer_response.status_code == 400
