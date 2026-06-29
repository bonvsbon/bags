API = "/api/v1/auth"


def test_register_login_me_flow(client):
    r = client.post(
        f"{API}/register",
        json={"email": "Ball@Example.com", "password": "supersecret"},
    )
    assert r.status_code == 200, r.text
    tokens = r.json()
    assert tokens["access"] and tokens["refresh"]

    # /me with access token
    me = client.get(
        f"{API}/me", headers={"Authorization": f"Bearer {tokens['access']}"}
    )
    assert me.status_code == 200
    assert me.json()["email"] == "ball@example.com"  # normalized lowercase
    assert me.json()["account_type"] == "registered"

    # duplicate email rejected
    dup = client.post(
        f"{API}/register",
        json={"email": "ball@example.com", "password": "anotherpass"},
    )
    assert dup.status_code == 409

    # login (case-insensitive email)
    login = client.post(
        f"{API}/login", json={"email": "BALL@example.com", "password": "supersecret"}
    )
    assert login.status_code == 200

    # wrong password
    bad = client.post(
        f"{API}/login", json={"email": "ball@example.com", "password": "nope"}
    )
    assert bad.status_code == 401


def test_refresh_rotation_and_logout(client):
    reg = client.post(
        f"{API}/register",
        json={"email": "rot@example.com", "password": "supersecret"},
    ).json()

    r1 = client.post(f"{API}/refresh", json={"refresh_token": reg["refresh"]})
    assert r1.status_code == 200
    new = r1.json()

    # old refresh now revoked
    r2 = client.post(f"{API}/refresh", json={"refresh_token": reg["refresh"]})
    assert r2.status_code == 401

    # logout new refresh, then it stops working
    out = client.post(f"{API}/logout", json={"refresh_token": new["refresh"]})
    assert out.status_code == 204
    r3 = client.post(f"{API}/refresh", json={"refresh_token": new["refresh"]})
    assert r3.status_code == 401


def test_guest_then_upgrade(client):
    g = client.post(f"{API}/guest").json()
    me = client.get(
        f"{API}/me", headers={"Authorization": f"Bearer {g['access']}"}
    ).json()
    assert me["account_type"] == "guest"
    assert me["email"] is None
    guest_id = me["id"]

    up = client.post(
        f"{API}/guest/upgrade",
        headers={"Authorization": f"Bearer {g['access']}"},
        json={"email": "guest@example.com", "password": "supersecret"},
    )
    assert up.status_code == 200

    me2 = client.get(
        f"{API}/me", headers={"Authorization": f"Bearer {up.json()['access']}"}
    ).json()
    assert me2["id"] == guest_id  # same user, data preserved
    assert me2["account_type"] == "registered"
    assert me2["email"] == "guest@example.com"


def test_me_requires_auth(client):
    assert client.get(f"{API}/me").status_code == 401
    assert (
        client.get(f"{API}/me", headers={"Authorization": "Bearer garbage"}).status_code
        == 401
    )


def test_google_not_configured(client):
    # GOOGLE_CLIENT_ID empty in test env → 503
    r = client.post(f"{API}/google", json={"id_token": "x"})
    assert r.status_code == 503
