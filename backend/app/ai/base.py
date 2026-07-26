"""Provider abstraction + error taxonomy (Phase 9 §2.1).

Every provider looks the same to the router. The error taxonomy is what lets
the router decide whether to skip to the next provider or bail out.
"""
from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass
class AiResult:
    text: str
    provider: str  # "gemini" | "groq" | ...
    model: str     # the concrete model that answered


@runtime_checkable
class AiProvider(Protocol):
    name: str
    tier: str  # "free" | "paid"

    def chat(self, *, system: str, messages: list[dict], task: str) -> AiResult:
        ...


class ProviderError(Exception):
    """Base for provider-side failures the router understands."""


class ProviderExhausted(ProviderError):
    """Rate-limit / quota hit (429) — cooldown until reset, then skip."""

    def __init__(self, message: str = "", retry_after: float | None = None):
        super().__init__(message)
        self.retry_after = retry_after


class ProviderUnavailable(ProviderError):
    """Down / timeout / 5xx — short cooldown, then skip."""


class ProviderBadRequest(ProviderError):
    """400 / our own bug — do NOT skip, surface it (it is not a quota problem)."""


class AllProvidersExhausted(Exception):
    """No provider in the pool could answer. `errors` = [(name, reason), ...]."""

    def __init__(self, errors: list[tuple[str, str]]):
        super().__init__("all AI providers exhausted")
        self.errors = errors
