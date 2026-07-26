# NL-SIT-006: Goal contributions accept zero and negative amounts

Severity: High
Status: Fixed
Area: Backend / Validation / Goals
Detected in: SIT `sit-20260630-0845`

## Summary

`POST /api/v1/goals/{id}/contribute` accepts `amount` values of `0` and negative numbers.

## Expected

Goal contribution amount must be strictly positive and invalid values should return `422`.

## Actual

The API returns `200 OK`. Negative contributions can reduce saved amount and increase the user's asset balance.

## Evidence

- Screenshot: `test-results/sit-20260630-0845/screenshots/NL-SIT-006.png`
- Test: `backend/tests/test_security_defects.py::test_goal_contribution_rejects_non_positive_amounts`
- Log: `test-results/sit-20260630-0845/backend/pytest-full.log`
- JUnit: `test-results/sit-20260630-0845/backend/pytest-full.xml`

## Suggested Fix

Use Pydantic constraints such as `Field(gt=0)` for contribution amount. Consider validation for goal target and saved amounts as well.

## Resolution

Fixed — `ContributeIn.amount` now uses `Field(gt=0)` (plus goal target/saved/monthly constraints); `amount <= 0` → **422**. Regression test passes.

## Retest Evidence (2026-06-30)

Retest run: `test-results/sit-20260630-retest-0915/`

Result: PASS. Backend full regression passed with **53 tests**, including `test_goal_contribution_rejects_non_positive_amounts`.

Actual system/API captures:

- App screen: `test-results/sit-20260630-retest-0915/screenshots/system-07-live-web-dashboard.png`
- API screen: `test-results/sit-20260630-retest-0915/screenshots/api-04-goals-endpoint.png`
- Test log: `test-results/sit-20260630-retest-0915/backend/pytest-full.log`
