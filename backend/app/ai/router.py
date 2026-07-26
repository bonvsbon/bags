"""Pool + cooldown + failover (Phase 9 §2.2).

Walk the provider pool; skip any provider still cooling down from a recent
quota/outage; on quota (429) put it to sleep until reset and move on; on outage
sleep briefly and move on; on a bad request surface immediately (it is our bug,
not a quota issue). If every provider is spent, raise AllProvidersExhausted.
"""
import time

from app.ai.base import (
    AiProvider,
    AiResult,
    AllProvidersExhausted,
    ProviderBadRequest,
    ProviderExhausted,
    ProviderUnavailable,
)

# Cooldown when a provider gives no Retry-After hint.
_DEFAULT_RATE_COOLDOWN = 60.0   # per-minute rate-limit
_UNAVAILABLE_COOLDOWN = 30.0    # transient outage


class AiRouter:
    def __init__(self, pool: list[AiProvider], *, clock=time.time):
        self.pool = pool
        self._clock = clock
        self._cooldown: dict[str, float] = {}  # provider name -> epoch when usable again

    def _available(self, name: str) -> bool:
        return self._clock() >= self._cooldown.get(name, 0)

    def chat(self, *, system: str, messages: list[dict], task: str) -> AiResult:
        errors: list[tuple[str, str]] = []
        for p in self.pool:
            if not self._available(p.name):
                errors.append((p.name, "cooldown"))
                continue
            try:
                return p.chat(system=system, messages=messages, task=task)
            except ProviderExhausted as e:
                wait = e.retry_after if e.retry_after is not None else _DEFAULT_RATE_COOLDOWN
                self._cooldown[p.name] = self._clock() + wait
                errors.append((p.name, "limit"))
            except ProviderUnavailable:
                self._cooldown[p.name] = self._clock() + _UNAVAILABLE_COOLDOWN
                errors.append((p.name, "down"))
            # ProviderBadRequest intentionally NOT caught — it bubbles up.
        raise AllProvidersExhausted(errors)

    def status(self) -> list[dict]:
        """Snapshot of each provider's availability (for /ai/status later)."""
        now = self._clock()
        out = []
        for p in self.pool:
            ready = self._cooldown.get(p.name, 0)
            out.append({
                "provider": p.name,
                "tier": p.tier,
                "available": now >= ready,
                "cooldown_until": ready if now < ready else None,
            })
        return out
