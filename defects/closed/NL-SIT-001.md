# NL-SIT-001: Transaction create accepts another user's account

Severity: Critical
Status: Fixed
Area: Backend / Security / Ledger
Detected in: SIT `sit-20260630-0845`

## Summary

`POST /api/v1/transactions` accepts an `account_id` owned by another user and returns `201 Created`.

## Expected

The API must reject foreign `account_id` values with `400`, `404`, or `422`, and the other user's account balance must remain unchanged.

## Actual

The API creates the transaction and can mutate another user's ledger balance.

## Evidence

- Screenshot: `test-results/sit-20260630-0845/screenshots/NL-SIT-001.png`
- Test: `backend/tests/test_security_defects.py::test_transaction_create_rejects_foreign_account_and_does_not_mutate_balance`
- Log: `test-results/sit-20260630-0845/backend/pytest-full.log`
- JUnit: `test-results/sit-20260630-0845/backend/pytest-full.xml`

## Suggested Fix

Validate `TransactionIn.account_id` belongs to the current user before creating the transaction. Reject missing or foreign accounts before calling `ledger.adjust_balance`.

## Resolution

Fixed — `require_owned_account()` guard added to `transactions.py` create + patch. A foreign or unknown `account_id` now returns **404** before any ledger adjustment. Regression test passes.

## Retest Evidence (2026-06-30)

Retest run: `test-results/sit-20260630-retest-0915/`

Result: PASS. Backend full regression passed with **53 tests**, including `test_transaction_create_rejects_foreign_account_and_does_not_mutate_balance`.

Actual system/API captures:

- App screen: `test-results/sit-20260630-retest-0915/screenshots/system-03-live-add-transaction.png`
- API screen: `test-results/sit-20260630-retest-0915/screenshots/api-01-transactions-endpoint.png`
- Test log: `test-results/sit-20260630-retest-0915/backend/pytest-full.log`
