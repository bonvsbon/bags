# NL-SIT-005: Transactions accept zero and negative amounts

Severity: Critical
Status: Fixed
Area: Backend / Validation / Ledger
Detected in: SIT `sit-20260630-0845`

## Summary

`POST /api/v1/transactions` accepts `amount` values of `0` and negative numbers.

## Expected

Transaction amount must be strictly positive and invalid values should return `422`.

## Actual

The API returns `201 Created`. Negative expense amounts can invert ledger behavior and increase an asset balance.

## Evidence

- Screenshot: `test-results/sit-20260630-0845/screenshots/NL-SIT-005.png`
- Test: `backend/tests/test_security_defects.py::test_transactions_reject_non_positive_amounts`
- Log: `test-results/sit-20260630-0845/backend/pytest-full.log`
- JUnit: `test-results/sit-20260630-0845/backend/pytest-full.xml`

## Suggested Fix

Use Pydantic constraints such as `Field(gt=0)` for transaction amount and add equivalent validation to patch when amount is supplied.

## Resolution

Fixed — `TransactionIn.amount` / `TransactionUpdate.amount` now use `Field(gt=0)`; `amount <= 0` → **422** before any ledger change. Regression test passes.

## Retest Evidence (2026-06-30)

Retest run: `test-results/sit-20260630-retest-0915/`

Result: PASS. Backend full regression passed with **53 tests**, including `test_transactions_reject_non_positive_amounts`.

Actual system/API captures:

- App screen: `test-results/sit-20260630-retest-0915/screenshots/system-03-live-add-transaction.png`
- API screen: `test-results/sit-20260630-retest-0915/screenshots/api-01-transactions-endpoint.png`
- Test log: `test-results/sit-20260630-retest-0915/backend/pytest-full.log`
