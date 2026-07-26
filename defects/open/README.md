# Open Defects

Defect tickets opened from SIT run `sit-20260630-0845`.

Evidence folder:

- `test-results/sit-20260630-0845/`
- Screenshot evidence: `test-results/sit-20260630-0845/screenshots/`
- Retest run: `test-results/sit-20260630-retest-0915/`
- Actual system-page screenshots: `test-results/sit-20260630-retest-0915/screenshots/`

**All defects are now resolved — tickets moved to [`../closed/`](../closed/).**

Current open defects: _none_ ✅

| ID | Title | Resolution |
|---|---|---|
| NL-SIT-001 | Transaction create accepts another user's account | Fixed — ownership guard → 404 |
| NL-SIT-002 | Transaction patch accepts another user's account | Fixed — ownership guard → 404 |
| NL-SIT-003 | Bill create accepts another user's account | Fixed — ownership guard → 404 |
| NL-SIT-004 | Budget create accepts another user's private category | Fixed — category visibility → 404 |
| NL-SIT-005 | Transactions accept zero/negative amounts | Fixed — `Field(gt=0)` → 422 |
| NL-SIT-006 | Goal contributions accept zero/negative amounts | Fixed — `Field(gt=0)` → 422 |
| NL-SIT-007 | Dev dependency audit reports high vulnerabilities | Fixed — removed dev-only `@capacitor/assets`; `npm audit` clean |
| NL-SIT-008 | Android debug APK build needs JDK/JAVA_HOME | By design — documented in `ANDROID.md` |

Regression coverage: `backend/tests/test_security_defects.py` (6 tests) is part of the suite — **53 passed** in retest `sit-20260630-retest-0915`.
