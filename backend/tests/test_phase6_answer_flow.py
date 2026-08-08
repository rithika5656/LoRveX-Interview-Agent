from fastapi.testclient import TestClient

from app.main import app
from app.schemas.interview import InterviewCreateRequest

client = TestClient(app)


def test_start_and_answer_flow_returns_evaluation():
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

    create_response = client.post("/api/interviews", json=payload.model_dump(by_alias=True))
    assert create_response.status_code == 200
    session_id = create_response.json()["sessionId"]

    start_response = client.post(f"/api/interviews/{session_id}/start")
    assert start_response.status_code == 200
    start_payload = start_response.json()
    question_id = start_payload["question"]["id"]

    answer_response = client.post(
        f"/api/interviews/{session_id}/answer",
        json={
            "questionId": question_id,
            "answer": "I approach backend design through APIs, data modeling, and observability.",
        },
    )

    assert answer_response.status_code == 200
    body = answer_response.json()
    assert "evaluation" in body
    evaluation = body["evaluation"]
    assert evaluation["questionId"] == question_id
    assert 0 <= evaluation["score"] <= 100
    assert evaluation["feedback"]
