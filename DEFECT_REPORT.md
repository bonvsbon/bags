# Defect Report for Claude

Date: 2026-06-29 · **Status: RESOLVED (2026-06-30)**

> ✅ All 8 defects addressed. DEF-001–006 fixed in code; DEF-007 fixed by
> dependency removal; DEF-008 is by-design and now documented.
> Tickets archived under `defects/closed/`.

## Test Summary

Added defect-focused unit tests:

- `backend/tests/test_security_defects.py`

Run commands:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests\test_security_defects.py -q
```

Result after fixes:

- Backend: **53 passed** (47 baseline + 6 defect regression tests) — was `6 failed`
- Frontend: **23 passed**
- `npm audit`: **0 vulnerabilities** (was 6 high + 2 moderate)

### Fix summary

| Defect | Fix |
|---|---|
| DEF-001 / DEF-002 | `require_owned_account()` guard in `transactions.py` create + patch → foreign `account_id` returns 404 before any ledger change |
| DEF-003 | `require_owned_account()` + `require_visible_category()` in `bills.py` create + patch |
| DEF-004 | `require_visible_category()` in `budgets.py` create (system-default or own category only) |
| DEF-005 | `TransactionIn/Update.amount` → `Field(gt=0)` (422) |
| DEF-006 | `ContributeIn.amount` → `Field(gt=0)` (+ goal target/saved/monthly constraints) (422) |
| DEF-007 | Removed dev-only `@capacitor/assets`; icons already generated/committed |
| DEF-008 | By design — JDK needed to build Android; documented in `ANDROID.md` |

New shared guards: `backend/app/services/ownership.py`.

## Defects

### DEF-001: Transaction create accepts another user's `account_id`

Severity: Critical

Expected:

- `POST /api/v1/transactions` must reject an `account_id` owned by another user.
- The foreign account balance must remain unchanged.

Actual:

- API returns `201 Created`.
- The other user's account can be debited/credited through ledger balance adjustment.

Failing test:

- `test_transaction_create_rejects_foreign_account_and_does_not_mutate_balance`

Likely area:

- `backend/app/routers/transactions.py`
- `backend/app/services/ledger.py`

### DEF-002: Transaction patch accepts another user's `account_id`

Severity: Critical

Expected:

- `PATCH /api/v1/transactions/{id}` must reject moving a transaction onto a foreign account.
- The foreign account balance must remain unchanged.

Actual:

- API returns `200 OK`.
- The foreign account can be mutated by patching `account_id`.

Failing test:

- `test_transaction_patch_rejects_foreign_account_and_does_not_mutate_balance`

Likely area:

- `backend/app/routers/transactions.py`

### DEF-003: Bill create accepts another user's `account_id`

Severity: High

Expected:

- `POST /api/v1/bills` must reject `account_id` not owned by the current user.

Actual:

- API returns `201 Created` and stores a bill linked to another user's account.
- Paying the bill can later charge that foreign account.

Failing test:

- `test_bill_create_rejects_foreign_account`

Likely area:

- `backend/app/routers/bills.py`

### DEF-004: Budget create accepts another user's private `category_id`

Severity: High

Expected:

- `POST /api/v1/budgets` must allow only system default categories or categories owned by the current user.

Actual:

- API returns `201 Created` for a private category owned by another user.

Failing test:

- `test_budget_create_rejects_foreign_user_category`

Likely area:

- `backend/app/routers/budgets.py`
- `backend/app/routers/categories.py`

### DEF-005: Transactions accept zero and negative amounts

Severity: Critical

Expected:

- `POST /api/v1/transactions` must reject `amount <= 0`, preferably with `422`.

Actual:

- API returns `201 Created`.
- Negative expense amounts invert ledger behavior and can increase an asset balance.

Failing test:

- `test_transactions_reject_non_positive_amounts`

Likely area:

- `backend/app/routers/transactions.py`
- request schema validation

### DEF-006: Goal contributions accept zero and negative amounts

Severity: High

Expected:

- `POST /api/v1/goals/{id}/contribute` must reject `amount <= 0`, preferably with `422`.

Actual:

- API returns `200 OK`.
- Negative contribution can reduce saved amount and increase available asset balance.

Failing test:

- `test_goal_contribution_rejects_non_positive_amounts`

Likely area:

- `backend/app/routers/goals.py`
- request schema validation

## Suggested Fix Direction

- Add shared ownership validators for foreign keys:
  - account belongs to current user
  - user category belongs to current user; system default category (`user_id IS NULL`) is allowed where appropriate
  - bill/account/category references are checked during create and patch
- Add Pydantic constraints:
  - money inputs that represent movement or limits should use `gt=0` unless a field explicitly allows zero
  - transaction amount, bill amount, goal target/saved/contribution, budget limit should be validated intentionally
- Add regression coverage by keeping `test_security_defects.py` in the suite and making all 6 pass.
