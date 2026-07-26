"""9.3 — /ai/chat: consent gate, grounded reply, history, ownership, no-provider."""
import uuid

import pytest

import app.routers.ai as ai_module
from app.ai.base import AiResult

API = "/api/v1"


def _register(client):
    email = f"chat-{uuid.uuid4().hex[:8]}@example.com"
    tok = client.post(
        f"{API}/auth/register", json={"email": email, "password": "supersecret"}
    ).json()
    return {"Authorization": f"Bearer {tok['access']}"}


class _FakeRouter:
    def chat(self, *, system, messages, task):
        # echo back that we saw the grounded system prompt, deterministically
        return AiResult(text="เดือนนี้ใช้จ่ายอยู่ในเกณฑ์ดีนะ", provider="fake", model="fake-1")


@pytest.fixture
def fake_ai(monkeypatch):
    monkeypatch.setattr(ai_module.factory, "router_for", lambda user: _FakeRouter())


def test_chat_requires_consent(client, fake_ai):
    h = _register(client)
    r = client.post(f"{API}/ai/chat", headers=h, json={"message": "เงินพอมั้ย"})
    assert r.status_code == 403
    assert r.json()["detail"] == "consent_required"


def test_consent_then_chat_saves_history(client, fake_ai):
    h = _register(client)
    c = client.post(f"{API}/ai/consent", headers=h)
    assert c.status_code == 200 and c.json()["ai_consent_at"]

    # /auth/me reflects consent + tier
    me = client.get(f"{API}/auth/me", headers=h).json()
    assert me["subscription_tier"] == "free"
    assert me["ai_consent_at"] is not None

    r = client.post(f"{API}/ai/chat", headers=h, json={"message": "เดือนนี้ใช้เยอะไปไหม"})
    assert r.status_code == 200
    body = r.json()
    assert body["provider"] == "fake"
    assert body["reply"]
    conv_id = body["conversation_id"]

    # conversation listed + messages persisted (user + assistant)
    convs = client.get(f"{API}/ai/conversations", headers=h).json()
    assert any(c["id"] == conv_id for c in convs)
    detail = client.get(f"{API}/ai/conversations/{conv_id}", headers=h).json()
    roles = [m["role"] for m in detail["messages"]]
    assert roles == ["user", "assistant"]
    assert detail["messages"][1]["provider"] == "fake"


def test_conversation_ownership_is_enforced(client, fake_ai):
    a = _register(client)
    client.post(f"{API}/ai/consent", headers=a)
    conv_id = client.post(
        f"{API}/ai/chat", headers=a, json={"message": "hi"}
    ).json()["conversation_id"]

    b = _register(client)
    client.post(f"{API}/ai/consent", headers=b)
    # user B must not see user A's conversation
    assert client.get(f"{API}/ai/conversations/{conv_id}", headers=b).status_code == 404
    assert client.delete(f"{API}/ai/conversations/{conv_id}", headers=b).status_code == 404
    # ...but continuing it as B (foreign id) is rejected too
    assert client.post(
        f"{API}/ai/chat", headers=b, json={"message": "x", "conversation_id": conv_id}
    ).status_code == 404


def test_chat_returns_503_when_no_provider(client):
    # no monkeypatch: default chains have no keys -> empty pool -> AllProvidersExhausted
    h = _register(client)
    client.post(f"{API}/ai/consent", headers=h)
    r = client.post(f"{API}/ai/chat", headers=h, json={"message": "hi"})
    assert r.status_code == 503
    assert r.json()["detail"] == "ai_unavailable"
