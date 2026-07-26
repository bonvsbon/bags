"""9.2 — router failover / cooldown / tier gate. Pure unit, no network."""
from types import SimpleNamespace

import pytest

from app.ai import factory
from app.ai.base import (
    AiResult,
    AllProvidersExhausted,
    ProviderBadRequest,
    ProviderExhausted,
    ProviderUnavailable,
)
from app.ai.router import AiRouter


class FakeProvider:
    def __init__(self, name, tier="free", raise_exc=None, text="ok"):
        self.name = name
        self.tier = tier
        self._raise = raise_exc
        self._text = text
        self.calls = 0

    def chat(self, *, system, messages, task):
        self.calls += 1
        if self._raise is not None:
            raise self._raise
        return AiResult(text=self._text, provider=self.name, model=f"{self.name}-model")


def _clock():
    """Manually advanced clock so tests never sleep."""
    state = {"t": 1000.0}
    return state, (lambda: state["t"])


def test_failover_skips_to_next_on_exhausted():
    first = FakeProvider("a", raise_exc=ProviderExhausted(retry_after=60))
    second = FakeProvider("b", text="from-b")
    r = AiRouter([first, second])
    res = r.chat(system="s", messages=[], task="chat")
    assert res.provider == "b"
    assert res.text == "from-b"
    assert first.calls == 1 and second.calls == 1


def test_cooldown_prevents_re_hit_until_reset():
    state, clk = _clock()
    first = FakeProvider("a", raise_exc=ProviderExhausted(retry_after=60))
    second = FakeProvider("b", text="from-b")
    r = AiRouter([first, second], clock=clk)

    r.chat(system="s", messages=[], task="chat")   # a exhausted -> cooldown 60s
    assert first.calls == 1

    state["t"] += 10                                # still cooling down
    r.chat(system="s", messages=[], task="chat")
    assert first.calls == 1                         # a NOT retried
    assert second.calls == 2                        # b served both

    state["t"] += 100                               # past reset
    first._raise = None
    first._text = "from-a"
    res = r.chat(system="s", messages=[], task="chat")
    assert res.provider == "a" and first.calls == 2


def test_bad_request_bubbles_up_not_skipped():
    first = FakeProvider("a", raise_exc=ProviderBadRequest("our bug"))
    second = FakeProvider("b")
    r = AiRouter([first, second])
    with pytest.raises(ProviderBadRequest):
        r.chat(system="s", messages=[], task="chat")
    assert second.calls == 0                        # never fell through


def test_all_exhausted_raises():
    a = FakeProvider("a", raise_exc=ProviderExhausted(retry_after=60))
    b = FakeProvider("b", raise_exc=ProviderUnavailable())
    r = AiRouter([a, b])
    with pytest.raises(AllProvidersExhausted) as ei:
        r.chat(system="s", messages=[], task="chat")
    names = {n for n, _ in ei.value.errors}
    assert names == {"a", "b"}


# ---- factory: key-gating + tier lock ----

def _settings(**over):
    base = dict(
        ai_free_list=["free_p"],
        ai_paid_list=["paid_p"],
        ai_allow_paid=False,
        gemini_api_key="",
    )
    base.update(over)
    return SimpleNamespace(**base)


@pytest.fixture
def fake_builders(monkeypatch):
    free_p = FakeProvider("free_p", tier="free")
    paid_p = FakeProvider("paid_p", tier="paid")
    monkeypatch.setitem(factory.PROVIDER_BUILDERS, "free_p", lambda s: free_p)
    monkeypatch.setitem(factory.PROVIDER_BUILDERS, "paid_p", lambda s: paid_p)
    return free_p, paid_p


def test_free_user_never_gets_paid_provider(fake_builders):
    user = SimpleNamespace(subscription_tier="free")
    router = factory.router_for(user, settings=_settings())
    assert [p.name for p in router.pool] == ["free_p"]


def test_paid_user_blocked_when_allow_paid_off(fake_builders):
    user = SimpleNamespace(subscription_tier="paid")
    router = factory.router_for(user, settings=_settings(ai_allow_paid=False))
    assert [p.name for p in router.pool] == ["free_p"]   # gate holds


def test_paid_user_gets_paid_lead_when_enabled(fake_builders):
    user = SimpleNamespace(subscription_tier="paid")
    router = factory.router_for(user, settings=_settings(ai_allow_paid=True))
    assert [p.name for p in router.pool] == ["paid_p", "free_p"]


def test_build_pool_skips_provider_without_key(monkeypatch):
    # builder returns None when the key is missing -> provider dropped from pool
    monkeypatch.setitem(factory.PROVIDER_BUILDERS, "free_p", lambda s: None)
    assert factory.build_pool(["free_p"], settings=_settings()) == []
