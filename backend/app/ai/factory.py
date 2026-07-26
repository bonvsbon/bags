"""Build the right provider pool for a user (Phase 9 §2.3).

Two hard rules live here:
  * a provider with no API key is skipped when building the pool (you only run
    what you signed up for);
  * a free user can NEVER be routed to a paid provider — the paid pool is only
    prepended when the user is `paid` AND `ai_allow_paid` is on. This is the
    guard that keeps AI spend from leaking to users who didn't pay.
"""
from app.ai.base import AiProvider
from app.ai.router import AiRouter
from app.config import Settings, get_settings


def _build_gemini(settings: Settings) -> AiProvider | None:
    if not settings.gemini_api_key:
        return None
    from app.ai.providers.gemini import GeminiProvider
    return GeminiProvider(settings.gemini_api_key)


# name -> builder(settings) -> AiProvider | None (None when no key)
# Groq / OpenRouter / Cerebras builders land in Phase 9.4.
PROVIDER_BUILDERS: dict[str, callable] = {
    "gemini": _build_gemini,
}


def build_pool(chain: list[str], settings: Settings | None = None) -> list[AiProvider]:
    settings = settings or get_settings()
    pool: list[AiProvider] = []
    for name in chain:
        builder = PROVIDER_BUILDERS.get(name)
        if builder is None:
            continue  # unknown provider name -> ignore
        provider = builder(settings)
        if provider is not None:
            pool.append(provider)
    return pool


def router_for(user, settings: Settings | None = None) -> AiRouter:
    settings = settings or get_settings()
    free = build_pool(settings.ai_free_list, settings)
    tier = getattr(user, "subscription_tier", "free")
    if tier == "paid" and settings.ai_allow_paid:
        # paid providers lead, free pool is overflow
        return AiRouter(build_pool(settings.ai_paid_list, settings) + free)
    return AiRouter(free)  # free user: free pool only, no paid ever
