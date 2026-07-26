# NL-SIT-004: Budget create accepts another user's private category

Severity: High
Status: Fixed
Area: Backend / Security / Budgets
Detected in: SIT `sit-20260630-0845`

## Summary

`POST /api/v1/budgets` accepts a private `category_id` owned by another user.

## Expected

Budgets must allow only categories where `category.user_id == current_user.id` or system default categories where `category.user_id IS NULL`.

## Actual

The API returns `201 Created` for a category owned by another user.

## Evidence

- Screenshot: `test-results/sit-20260630-0845/screenshots/NL-SIT-004.png`
- Test: `backend/tests/test_security_defects.py::test_budget_create_rejects_foreign_user_category`
- Log: `test-results/sit-20260630-0845/backend/pytest-full.log`
- JUnit: `test-results/sit-20260630-0845/backend/pytest-full.xml`

## Suggested Fix

Add a shared category visibility validator and use it in budget create/update and any endpoint accepting `category_id`.

## Resolution

Fixed — `require_visible_category()` added to `budgets.py` create; allows only system-default (`user_id IS NULL`) or the caller's own category. Foreign private category → **404**. Regression test passes.

## Retest Evidence (2026-06-30)

Retest run: `test-results/sit-20260630-retest-0915/`

Result: PASS. Backend full regression passed with **53 tests**, including `test_budget_create_rejects_foreign_user_category`.

Actual system/API captures:

- App screen: `test-results/sit-20260630-retest-0915/screenshots/system-07-live-web-dashboard.png`
- API screen: `test-results/sit-20260630-retest-0915/screenshots/api-03-budgets-endpoint.png`
- Test log: `test-results/sit-20260630-retest-0915/backend/pytest-full.log`
