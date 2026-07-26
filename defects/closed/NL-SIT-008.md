# NL-SIT-008: Android debug APK build cannot run without JDK/JAVA_HOME

Severity: Medium
Status: By design (documented)
Area: Android / Build Environment
Detected in: SIT `sit-20260630-0845`

## Summary

Capacitor sync passes, but Gradle `assembleDebug` cannot run because Java is not available on PATH and `JAVA_HOME` is not set.

## Expected

SIT should be able to build a debug APK or clearly document that Android Studio/JDK setup is required before APK verification.

## Actual

`gradlew.bat assembleDebug` exits with `9009` and reports:

```text
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

## Evidence

- Screenshot: `test-results/sit-20260630-0845/screenshots/NL-SIT-008.png`
- Capacitor sync: `test-results/sit-20260630-0845/build/android-cap-sync.log`
- Gradle build: `test-results/sit-20260630-0845/build/android-assembleDebug.log`

## Suggested Fix

Install Android Studio/JDK or configure `JAVA_HOME`, then rerun:

```powershell
cd android
.\gradlew.bat assembleDebug
```

## Resolution

By design / documented — building an Android APK inherently requires a JDK. Android Studio bundles one; terminal builds set `JAVA_HOME` to the Studio JBR. Documented in `ANDROID.md` (build section + troubleshooting).

## Retest Evidence (2026-06-30)

Retest run: `test-results/sit-20260630-retest-0915/`

Result: DOCUMENTED / ENV BLOCKED. Capacitor Android sync passes, but `assembleDebug` still cannot execute on this machine until JDK/JAVA_HOME is configured.

Evidence:

- Capacitor sync log: `test-results/sit-20260630-retest-0915/build/android-cap-sync.log`
- Gradle build log: `test-results/sit-20260630-retest-0915/build/android-assembleDebug.log`

No app-page screenshot applies to this local build-environment defect.
