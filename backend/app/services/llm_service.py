from __future__ import annotations
import os
from typing import Any

from app.ai.openai_provider import OpenAIProvider
from pydantic import BaseModel
import json


class LLMServiceError(RuntimeError):
    pass


class LLMService:
    def __init__(self) -> None:
        self.provider_name = os.getenv("LLM_PROVIDER", "openai")
        self.api_key = os.getenv("LLM_API_KEY") or None
        self.model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        self._provider = None

    def provider(self) -> OpenAIProvider:
        if self._provider is None:
            # for now only OpenAIProvider is implemented
            self._provider = OpenAIProvider(api_key=self.api_key, model=self.model)
        return self._provider

    def generate_text(self, prompt: str, temperature: float = 0.2, max_tokens: int = 512) -> str:
        """Generate plain text from the configured provider.

        Returns the raw text. On failure raises LLMServiceError.
        """
        # Prefer provider-specific helper if available
        prov = self.provider()
        # If the provider exposes a direct method, use it
        if hasattr(prov, "generate_text"):
            try:
                return prov.generate_text(prompt, temperature=temperature, max_tokens=max_tokens)
            except Exception as exc:
                raise LLMServiceError("provider generate_text failed") from exc

        # Otherwise try using OpenAI SDK directly (optional dependency)
        try:
            import openai  # type: ignore
        except Exception:
            # fallback: return prompt or raise
            raise LLMServiceError("no provider available and OpenAI SDK not installed")

        try:
            openai.api_key = self.api_key or os.getenv("OPENAI_API_KEY")
            resp = openai.ChatCompletion.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return resp.choices[0].message.content or ""
        except Exception as exc:
            raise LLMServiceError("OpenAI request failed") from exc

    def generate_structured(self, prompt: str, output_model: type[BaseModel], system: str | None = None) -> BaseModel:
        """Generate structured JSON and parse into `output_model`.

        `output_model` must be a Pydantic BaseModel subclass. This will attempt
        to ask the provider for strict JSON and then parse it. On failure a
        LLMServiceError is raised.
        """
        prov = self.provider()
        if hasattr(prov, "generate_structured"):
            try:
                payload = prov.generate_structured(prompt)
                # if provider returned dict-like, validate
                if isinstance(payload, (dict, list)):
                    return output_model.model_validate(payload)
                if isinstance(payload, str):
                    return output_model.model_validate(json.loads(payload))
            except Exception as exc:
                raise LLMServiceError("provider structured generation failed") from exc

        # Fallback to OpenAI SDK JSON completion
        try:
            import openai  # type: ignore
        except Exception:
            raise LLMServiceError("no provider available and OpenAI SDK not installed")

        try:
            openai.api_key = self.api_key or os.getenv("OPENAI_API_KEY")
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            resp = openai.ChatCompletion.create(
                model=self.model,
                messages=messages,
                temperature=0,
                max_tokens=1500,
                response_format={"type": "json_object"},
            )
            raw = resp.choices[0].message.content or "{}"
            data = json.loads(raw)
            return output_model.model_validate(data)
        except Exception as exc:
            # last-ditch attempt: try to parse JSON from a plain text reply
            try:
                resp = openai.ChatCompletion.create(
                    model=self.model,
                    messages=messages,
                    temperature=0,
                    max_tokens=1500,
                )
                raw = resp.choices[0].message.content or "{}"
                data = json.loads(raw)
                return output_model.model_validate(data)
            except Exception as inner:
                raise LLMServiceError("structured generation failed") from inner


llm_service = LLMService()
