import uuid


API = "/api/v1"


def _register(client, prefix="sec"):
    email = f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"
    token = client.post(
        f"{API}/auth/register",
        json={"email": email, "password": "supersecret"},
    ).json()
    return {"Authorization": f"Bearer {token['access']}"}


def _asset_account(client, headers, balance=10000):
    return client.post(
        f"{API}/accounts",
        headers=headers,
        json={"name": "asset", "type": "asset", "kind": "bank", "balance": balance},
    ).json()


def _balance(client, headers, account_id):
    return client.get(f"{API}/accounts/{account_id}", headers=headers).json()["balance"]


def test_transaction_create_rejects_foreign_account_and_does_not_mutate_balance(client):
    owner_h = _register(client, "txn-owner")
    attacker_h = _register(client, "txn-attacker")
    foreign_account = _asset_account(client, owner_h, balance=10000)

    res = client.post(
        f"{API}/transactions",
        headers=attacker_h,
        json={"type": "expense", "amount": 1000, "account_id": foreign_account["id"]},
    )

    assert res.status_code in (400, 404, 422)
    assert _balance(client, owner_h, foreign_account["id"]) == 10000.0


def test_transaction_patch_rejects_foreign_account_and_does_not_mutate_balance(client):
    owner_h = _register(client, "patch-owner")
    attacker_h = _register(client, "patch-attacker")
    foreign_account = _asset_account(client, owner_h, balance=10000)
    txn = client.post(
        f"{API}/transactions",
        headers=attacker_h,
        json={"type": "expense", "amount": 500},
    ).json()

    res = client.patch(
        f"{API}/transactions/{txn['id']}",
        headers=attacker_h,
        json={"account_id": foreign_account["id"]},
    )

    assert res.status_code in (400, 404, 422)
    assert _balance(client, owner_h, foreign_account["id"]) == 10000.0


def test_bill_create_rejects_foreign_account(client):
    owner_h = _register(client, "bill-owner")
    attacker_h = _register(client, "bill-attacker")
    foreign_account = _asset_account(client, owner_h, balance=10000)

    res = client.post(
        f"{API}/bills",
        headers=attacker_h,
        json={"name": "rent", "amount": 2000, "due_day": 1, "account_id": foreign_account["id"]},
    )

    assert res.status_code in (400, 404, 422)


def test_budget_create_rejects_foreign_user_category(client):
    owner_h = _register(client, "cat-owner")
    attacker_h = _register(client, "cat-attacker")
    foreign_category = client.post(
        f"{API}/categories",
        headers=owner_h,
        json={"name": "private food", "kind": "expense"},
    ).json()

    res = client.post(
        f"{API}/budgets",
        headers=attacker_h,
        json={"category_id": foreign_category["id"], "limit_amount": 3000, "period": "2026-06"},
    )

    assert res.status_code in (400, 404, 422)


def test_transactions_reject_non_positive_amounts(client):
    headers = _register(client, "amount")
    account = _asset_account(client, headers, balance=1000)

    for amount in (0, -100):
        res = client.post(
            f"{API}/transactions",
            headers=headers,
            json={"type": "expense", "amount": amount, "account_id": account["id"]},
        )
        assert res.status_code == 422

    assert _balance(client, headers, account["id"]) == 1000.0


def test_goal_contribution_rejects_non_positive_amounts(client):
    headers = _register(client, "goal-amount")
    _asset_account(client, headers, balance=1000)
    goal = client.post(
        f"{API}/goals",
        headers=headers,
        json={"name": "trip", "target_amount": 10000, "saved_amount": 1000},
    ).json()

    for amount in (0, -100):
        res = client.post(
            f"{API}/goals/{goal['id']}/contribute",
            headers=headers,
            json={"amount": amount},
        )
        assert res.status_code == 422

    unchanged = client.get(f"{API}/goals", headers=headers).json()[0]
    assert unchanged["saved_amount"] == 1000.0
