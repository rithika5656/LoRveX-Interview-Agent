import json
import uuid
import urllib.request

url = 'http://127.0.0.1:8000/api/interview'
session_id = uuid.uuid4().hex
candidate = {
    'member': {
        'id': 'test-cand',
        'name': 'Test Candidate',
        'jobRole': 'Software Engineer',
        'yearsExperience': 3,
        'education': 'BS Computer Science',
    },
    'missions': [],
    'signals': {'commitDays': 0, 'missionsCompleted': 0, 'missionsFirstTry': 0},
}
start_payload = {'sessionId': session_id, 'candidate': candidate}
req = urllib.request.Request(url, data=json.dumps(start_payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    print('START', resp.status)
    start_body = resp.read().decode('utf-8')
    print(start_body)
cont_payload = {'sessionId': session_id, 'message': 'I would use embeddings with a vector database and cosine similarity.'}
req2 = urllib.request.Request(url, data=json.dumps(cont_payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req2) as resp2:
    print('CONT', resp2.status)
    cont_body = resp2.read().decode('utf-8')
    print(cont_body)
