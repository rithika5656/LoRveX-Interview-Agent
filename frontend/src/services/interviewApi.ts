import type { InterviewCreationResponse, InterviewSetupPayload, InterviewSessionApiResponse, InterviewStartApiResponse } from "../types/interview";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

function getBackendUrl() {
  return (import.meta.env.VITE_BACKEND_URL ?? DEFAULT_BACKEND_URL).replace(/\/$/, "");
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function createInterviewSession(payload: InterviewSetupPayload): Promise<InterviewCreationResponse> {
  const response = await fetch(`${getBackendUrl()}/api/interviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as InterviewCreationResponse;
}

export async function getInterviewSession(sessionId: string): Promise<InterviewSessionApiResponse> {
  const response = await fetch(`${getBackendUrl()}/api/interviews/${sessionId}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as InterviewSessionApiResponse;
}

export async function startInterviewSession(sessionId: string): Promise<InterviewStartApiResponse> {
  const response = await fetch(`${getBackendUrl()}/api/interviews/${sessionId}/start`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as InterviewStartApiResponse;
}
