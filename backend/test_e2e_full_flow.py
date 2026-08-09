import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/interview"

candidate_payload = {
    "member": {
        "id": "cand-1",
        "name": "Alex Candidate",
        "jobRole": "Fullstack Engineer",
        "yearsExperience": 4,
        "education": "BS Computer Science",
        "status": "Active"
    },
    "missions": [
        {"day": 1, "title": "Setup", "passed": True},
        {"day": 2, "title": "Local LLM", "passed": True}
    ],
    "signals": {
        "commitDays": 12,
        "missionsCompleted": 5,
        "missionsFirstTry": 4
    }
}

session_id = "test-e2e-session-888"

# 1. Start Interview
start_req = {
    "sessionId": session_id,
    "candidate": candidate_payload
}
res = requests.post(BASE_URL, json=start_req)
print("START STATUS:", res.status_code)
assert res.status_code == 200
start_data = res.json()
print("START RESPONSE:", json.dumps(start_data, indent=2))
assert start_data["done"] is False
assert "Welcome" in start_data["reply"]
assert "question" in start_data

# 2. Answers simulating technical conversation
answers = [
    "I would use embeddings with a vector database and cosine similarity for semantic retrieval.",
    "For system architecture, I isolate business rules, separate adapters from core services, build bounded interfaces, and make the system observable.",
    "I manage state in React using modular hooks and lightweight stores, avoiding unnecessary re-renders.",
    "For database operations, I write optimized SQL queries, use indexing, and prevent N+1 queries with eager loading.",
    "I use Docker to containerize services and Kubernetes for deployment with liveness and readiness probes.",
    "For prompt engineering, I use structured outputs with Pydantic validation and guardrails against prompt injection.",
    "I build automated evaluation datasets to measure retrieval accuracy and LLM response grounding.",
    "To optimize performance, I implement token budgeting, caching, and streaming responses with server-sent events.",
    "In capstone projects, I integrate RAG retrieval, multi-agent orchestration, and MCP tool execution."
]

turn = 1
for ans in answers:
    print(f"\n--- TURN {turn} ---")
    cont_req = {
        "sessionId": session_id,
        "message": ans
    }
    res = requests.post(BASE_URL, json=cont_req)
    print("STATUS CODE:", res.status_code)
    assert res.status_code == 200
    data = res.json()
    print("REPLY:", data.get("reply"))
    print("DONE:", data.get("done"))
    print("COVERED DAYS:", data.get("coveredDays"))
    
    if data.get("done") is True:
        print("\n--- INTERVIEW FINISHED ---")
        feedback = data.get("feedback")
        print("FEEDBACK SUMMARY:", json.dumps(feedback, indent=2))
        assert feedback is not None
        assert "overall_score" in feedback
        assert "summary" in feedback or "interview_summary" in feedback
        assert "strengths" in feedback or "technical_strengths" in feedback
        assert "gaps" in feedback or "knowledge_gaps" in feedback
        assert "next" in feedback or "recommendations" in feedback
        assert len(data.get("coveredDays", [])) >= 4
        assert turn >= 8
        print(f"SUCCESS! Completed after {turn} turns with {len(data.get('coveredDays', []))} curriculum days covered.")
        break
    else:
        assert data.get("reply") is not None
        assert len(data.get("reply")) > 5
    turn += 1

print("ALL E2E VERIFICATION CHECKS PASSED!")
