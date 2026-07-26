"""Gemini (Google AI Studio) adapter — the first live provider (Phase 9.3).

Template for the Groq/OpenRouter/Cerebras adapters in 9.4: call the REST API
via httpx, map our `task` to a concrete model, and translate HTTP failures into
the shared error taxonomy so the router knows whether to skip or surface.
"""
import httpx

from app.ai.base import (
    AiResult,
    ProviderBadRequest,
    ProviderExhausted,
    ProviderUnavailable,
)

_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# task -> model. Flash is fast + generous on the free tier; good enough for chat.
_MODEL_BY_TASK = {
    "cheap": "gemini-2.0-flash-lite",
    "chat": "gemini-2.0-flash",
    "plan": "gemini-2.0-flash",
}
_DEFAULT_MODEL = "gemini-2.0-flash"


class GeminiProvider:
    name = "gemini"
    tier = "free"

    def __init__(self, api_key: str, *, timeout: float = 30.0):
        self._key = api_key
        self._timeout = timeout

    def _model_for(self, task: str) -> str:
        return _MODEL_BY_TASK.get(task, _DEFAULT_MODEL)

    def chat(self, *, system: str, messages: list[dict], task: str) -> AiResult:
        model = self._model_for(task)
        # our roles (user/assistant) -> Gemini roles (user/model)
        contents = [
            {
                "role": "model" if m.get("role") == "assistant" else "user",
                "parts": [{"text": m.get("content", "")}],
            }
            for m in messages
        ]
        payload = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": contents,
        }
        url = _ENDPOINT.format(model=model)
        try:
            resp = httpx.post(
                url,
                params={"key": self._key},
                json=payload,
                timeout=self._timeout,
            )
        except httpx.TimeoutException as e:
            raise ProviderUnavailable(f"gemini timeout: {e}") from e
        except httpx.HTTPError as e:
            raise ProviderUnavailable(f"gemini transport error: {e}") from e

        if resp.status_code == 429:
            retry_after = _parse_retry_after(resp.headers.get("Retry-After"))
            raise ProviderExhausted("gemini quota/rate limit", retry_after=retry_after)
        if resp.status_code >= 500:
            raise ProviderUnavailable(f"gemini {resp.status_code}")
        if resp.status_code == 400 or resp.status_code == 403:
            # 400 = malformed request (our bug); 403 = key/permission (surface it)
            raise ProviderBadRequest(f"gemini {resp.status_code}: {resp.text[:200]}")
        if resp.status_code != 200:
            raise ProviderUnavailable(f"gemini unexpected {resp.status_code}")

        text = _extract_text(resp.json())
        return AiResult(text=text, provider=self.name, model=model)


def _parse_retry_after(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _extract_text(data: dict) -> str:
    try:
        parts = data["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts).strip()
    except (KeyError, IndexError, TypeError) as e:
        raise ProviderBadRequest(f"gemini: unexpected response shape ({e})") from e
