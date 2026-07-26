# NL-SIT-007: Dev dependency audit reports high vulnerabilities

Severity: Medium
Status: Fixed
Area: Tooling / Dependency Security
Detected in: SIT `sit-20260630-0845`

## Summary

`npm audit --audit-level=moderate` reports 8 vulnerabilities through the dev/tooling dependency chain for `@capacitor/assets`.

## Expected

SIT should have no high-severity audit findings, or findings should be explicitly accepted with documented scope and mitigation.

## Actual

Audit reports vulnerable `minimatch`, `tar`, and `uuid` paths through `@capacitor/assets`, `@capacitor/cli@5.7.8`, `@trapezedev/project`, and `xcode`.

Runtime production audit using `npm audit --omit=dev --audit-level=moderate` passes.

## Evidence

- Screenshot: `test-results/sit-20260630-0845/screenshots/NL-SIT-007.png`
- Log: `test-results/sit-20260630-0845/audit/npm-audit-all.log`
- Runtime audit: `test-results/sit-20260630-0845/audit/npm-audit-runtime.log`

## Suggested Fix

Review whether `@capacitor/assets` is needed in the project after asset generation. If still needed, upgrade/replace the tooling path or document risk acceptance for dev-only usage.

## Resolution

Fixed — removed the dev-only `@capacitor/assets` package (a one-time icon generator; icons are already generated and committed under `android/`). `npm audit` now reports **0 vulnerabilities**. Reinstall temporarily only if regenerating icons.

## Retest Evidence (2026-06-30)

Retest run: `test-results/sit-20260630-retest-0915/`

Result: PASS. `npm audit --audit-level=moderate` reports **0 vulnerabilities**.

Evidence:

- Full audit log: `test-results/sit-20260630-retest-0915/audit/npm-audit-all.log`
- Runtime audit log: `test-results/sit-20260630-retest-0915/audit/npm-audit-runtime.log`

No app-page screenshot applies to this tooling-only defect.
