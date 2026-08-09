import type {
  InterviewApiResponse,
  InterviewContinueRequest,
  InterviewStartRequest,
} from "../types/interview";

const PRODUCTION_API_BASE_URL = "https://lorvex-interview-agent-1.onrender.com";

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, "");
  }
  return import.meta.env.DEV ? "http://127.0.0.1:8000" : PRODUCTION_API_BASE_URL;
}

function readErrorMessage(response: Response, textBody: string): string {
  if (!textBody || !textBody.trim()) {
    return `Server request failed with status ${response.status} (${response.statusText || "Empty response body"}).`;
  }
  try {
    const payload = JSON.parse(textBody) as { error?: { message?: string }; detail?: string; message?: string };
    return payload.error?.message ?? payload.detail ?? payload.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Server error (${response.status}): ${textBody.slice(0, 160)}`;
  }
}

export async function sendInterviewRequest(
  payload: InterviewStartRequest | InterviewContinueRequest,
): Promise<InterviewApiResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/interview`;

  console.log(`[LoRveX API] Sending request to ${url}`, {
    sessionId: payload.sessionId,
    type: "candidate" in payload ? "start" : "continue",
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (netErr) {
    console.error("[LoRveX API] Network error:", netErr);
    throw new Error(`Unable to connect to interview server at ${baseUrl}. Please check network connection.`);
  }

  const responseText = await response.text();

  console.log(`[LoRveX API] Received status ${response.status} from ${url}`);

  if (!response.ok) {
    const errorMsg = readErrorMessage(response, responseText);
    console.error(`[LoRveX API] Request error (${response.status}):`, errorMsg);
    throw new Error(errorMsg);
  }

  if (!responseText || !responseText.trim()) {
    console.error(`[LoRveX API] Empty response body from ${url} (Status ${response.status})`);
    throw new Error(`Server returned an empty response (Status ${response.status}). Please try again.`);
  }

  try {
    return JSON.parse(responseText) as InterviewApiResponse;
  } catch (parseErr) {
    console.error("[LoRveX API] Invalid JSON response:", responseText);
    throw new Error(`Server returned invalid JSON response: ${responseText.slice(0, 160)}`);
  }
}
