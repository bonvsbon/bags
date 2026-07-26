# NL-SIT-003: Bill create accepts another user's account

Severity: High
Status: Fixed
Area: Backend / Security / Bills
Detected in: SIT `sit-20260630-0845`

## Summary

`POST /api/v1/bills` accepts `account_id` owned by another user.

## Expected

The API must reject foreign `account_id` values when creating or updating bills.

## Actual

The API returns `201 Created` and stores a bill linked to another user's account. Paying that bill can later charge the foreign account.

## Evidence

- Screenshot: `test-results/sit-20260630-0845/screenshots/NL-SIT-003.png`
- Test: `backend/tests/test_security_defects.py::test_bill_create_rejects_foreign_account`
- Log: `test-results/sit-20260630-0845/backend/pytest-full.log`
- JUnit: `test-results/sit-20260630-0845/backend/pytest-full.xml`

## Suggested Fix

Validate bill `account_id` ownership on create and patch. Also validate `category_id` uses either a system default category or the current user's category.

## Resolution

Fixed — `require_owned_account()` + `require_visible_category()` added to `bills.py` create + patch. Foreign `account_id` → **404**. Regression test passes.

## Retest Evidence (2026-06-30)

Retest run: `test-results/sit-20260630-retest-0915/`

Result: PASS. Backend full regression passed with **53 tests**, including `test_bill_create_rejects_foreign_account`.

Actual system/API captures:

- App screen: `test-results/sit-20260630-retest-0915/screenshots/system-07-live-web-dashboard.png`
- API screen: `test-results/sit-20260630-retest-0915/screenshots/api-02-bills-endpoint.png`
- Test log: `test-results/sit-20260630-retest-0915/backend/pytest-full.log`
