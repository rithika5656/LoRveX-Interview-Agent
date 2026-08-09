from fastapi.testclient import TestClient
from app.main import app
from app.agents.candidate_profiler import build_profile
from app.ai.openai_provider import OpenAIProvider
from app.schemas.interview import InterviewConfiguration, InterviewQuestion

client = TestClient(app)


def test_candidate_profiler_strategy():
    sample_candidate = {
        "member": {
            "id": "cand-1",
            "name": "Alex Rivera",
            "jobRole": "AI Systems Engineer",
            "yearsExperience": 4,
            "education": "B.S. CS",
        },
        "missions": [
            {"day": 1, "title": "RAG Fundamentals", "passed": True, "attempts": 1},
            {"day": 2, "title": "Vector Search", "passed": True, "attempts": 1},
            {"day": 3, "title": "MCP Protocol", "passed": False, "skipped": True},
        ],
        "signals": {"commitDays": 25, "missionsCompleted": 2, "missionsFirstTry": 2},
    }

    profile = build_profile(sample_candidate)
    assert profile["name"] == "Alex Rivera"
    assert "strategy" in profile
    assert profile["strategy"]["initial_difficulty"] == "intermediate"
    assert 3 in profile["skipped_topics"]


def test_misconception_detection_and_probing():
    provider = OpenAIProvider()
    config = InterviewConfiguration(
        candidateName="Test User",
        targetRole="AI Engineer",
        experienceLevel="intermediate",
        interviewType="technical",
        difficulty="adaptive",
        duration=20,
    )
    q = InterviewQuestion(
        id="q-101",
        text="How does RAG work?",
        type="technical",
        difficulty="medium",
        stage="1",
        curriculum_day=1,
        topic="RAG",
    )

    # Candidate makes false claim
    answer = "RAG completely eliminates all hallucinations in LLMs by using embeddings."
    evaluation = provider.evaluate_answer(config, q, answer)

    assert len(evaluation.misconceptions) > 0
    assert "hallucinat" in evaluation.misconceptions[0].lower()

    decision = provider.decide_next_action(config, None, q, answer, evaluation)
    assert decision.action == "clarify_answer"

    next_q = provider.generate_next_question(config, None, q, answer, evaluation, decision)
    assert "hallucinat" in next_q.text.lower() or "limitation" in next_q.text.lower() or "incorrect" in next_q.text.lower()


def test_api_single_endpoint_flow():
    session_id = "test-session-enhancement-1"

    # Start turn
    start_payload = {
        "sessionId": session_id,
        "candidate": {
            "member": {
                "id": "cand-2",
                "name": "Sam Taylor",
                "jobRole": "ML Engineer",
                "yearsExperience": 3,
                "education": "M.S. Data Science",
            },
            "missions": [],
            "signals": {"commitDays": 10, "missionsCompleted": 5, "missionsFirstTry": 4},
        },
    }
    resp1 = client.post("/api/interview", json=start_payload)
    assert resp1.status_code == 200
    b1 = resp1.json()
    assert b1["done"] is False
    assert "question" in b1
    assert "plan" in b1
    assert "coveredDays" in b1

    # Continue turn 1
    cont_payload = {
        "sessionId": session_id,
        "message": "I would use embeddings and vector search for semantic retrieval in RAG architectures.",
    }
    resp2 = client.post("/api/interview", json=cont_payload)
    assert resp2.status_code == 200
    b2 = resp2.json()
    assert "reply" in b2
    assert "next" in b2
