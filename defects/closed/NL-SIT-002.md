# NL-SIT-002: Transaction patch accepts another user's account

Severity: Critical
Status: Fixed
Area: Backend / Security / Ledger
Detected in: SIT `sit-20260630-0845`

## Summary

`PATCH /api/v1/transactions/{id}` allows changing a user's transaction to reference another user's `account_id`.

## Expected

The API must reject foreign `account_id` values and leave the foreign account balance unchanged.

## Actual

The API returns `200 OK` and can mutate another user's account balance during reverse/apply ledger adjustment.

## Evidence

- Screenshot: `test-results/sit-20260630-0845/screenshots/NL-SIT-002.png`
- Test: `backend/tests/test_security_defects.py::test_transaction_patch_rejects_foreign_account_and_does_not_mutate_balance`
- Log: `test-results/sit-20260630-0845/backend/pytest-full.log`
- JUnit: `test-results/sit-20260630-0845/backend/pytest-full.xml`

## Suggested Fix

Validate patched `account_id` ownership before applying ledger adjustments. If invalid, reject before reversing the old transaction balance.

## Resolution

Fixed — `require_owned_account()` validates the incoming `account_id` in `patch_transaction` before the reverse/apply ledger step. Foreign account → **404**, balance untouched. Regression test passes.

## Retest Evidence (2026-06-30)

Retest run: `test-results/sit-20260630-retest-0915/`

Result: PASS. Backend full regression passed with **53 tests**, including `test_transaction_patch_rejects_foreign_account_and_does_not_mutate_balance`.

Actual system/API captures:

- App screen: `test-results/sit-20260630-retest-0915/screenshots/system-04-live-transactions.png`
- API screen: `test-results/sit-20260630-retest-0915/screenshots/api-01-transactions-endpoint.png`
- Test log: `test-results/sit-20260630-retest-0915/backend/pytest-full.log`
