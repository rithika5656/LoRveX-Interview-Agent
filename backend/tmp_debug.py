import sys, os
root = os.getcwd()
sys.path.insert(0, root)
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.interview import InterviewCreateRequest

client = TestClient(app)
payload = InterviewCreateRequest.model_validate({
    "candidateName": "Alex Candidate",
    "targetRole": "backend-developer",
    "experienceLevel": "intermediate",
    "interviewType": "technical",
    "difficulty": "medium",
    "duration": 10,
})
res = client.post("/api/interviews", json=payload.model_dump(by_alias=True))
print("create", res.status_code, res.json())
sid = res.json()["sessionId"]
res = client.post(f"/api/interviews/{sid}/start")
print("start", res.status_code, res.json())
question_id = res.json()["question"]["id"]
print("question_id", question_id)
for i in range(15):
    ans = client.post(
        f"/api/interviews/{sid}/answer",
        json={
            "questionId": question_id,
            "answer": "I would explain the tradeoffs clearly and provide a concrete implementation approach.",
        },
    )
    print("answer", i, ans.status_code)
    if ans.status_code == 200:
        body = ans.json()
        print(body)
        nxt = body["next"]
        print("next", nxt["action"], nxt.get("question") and nxt["question"]["id"])
        if nxt["action"] == "finish_interview" or not nxt.get("question"):
            break
        next_q = nxt.get("question")
        if next_q:
            question_id = next_q["id"]
        else:
            break
    else:
        print(ans.text)
        break
