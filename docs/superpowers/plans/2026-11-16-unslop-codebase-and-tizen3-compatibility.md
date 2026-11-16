# Implementation Plan: Codebase Unslop & Tizen 3.0 Safe Refactoring

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the embedded Android native project out of GitHub Actions YAML into a clean `android-app/` project, refactor `inject.js` into readable, maintainable, strict ES5 code compatible with Samsung Tizen 3.0, and verify end-to-end APK building.

**Architecture:**
1. Standalone `android-app/` with Gradle 8.4, Java 17, ExoPlayer/Media3, SurfaceView, FileProvider, and background auto-updater.
2. Lightweight, clean CI workflow in `.github/workflows/build-apk.yml`.
3. Strict ES5 refactoring of `android/dist/inject.js` preserving Tizen 3.0 (Chromium 47) compatibility and `hls.js` fallback.

**Tech Stack:** Android SDK, Gradle, Vanilla JavaScript (Strict ES5), Node.js test runner.

**Spec:** `docs/superpowers/specs/2026-11-16-unslop-codebase-and-tizen3-compatibility-design.md`

## Global Constraints
- **Strict ES5**: No `async/await`, no arrow functions `=>`, no `?.` or `??`, no `padStart`, no `includes`.
- **Tizen 3.0 compatibility**: Keep `hls.js@0.14.17` and `mpegts.js@1.7.3` in `android/index.html`.
- **Tizen keycodes**: Keep `10009` (Return), `10190`, `10252`, `405`, `427`, `428`.

---

### Task 1: Standalone Android Project (`android-app/`)

**Files:**
- Create:
  - `android-app/build.gradle`
  - `android-app/settings.gradle`
  - `android-app/gradle.properties`
  - `android-app/app/build.gradle`
  - `android-app/app/src/main/AndroidManifest.xml`
  - `android-app/app/src/main/java/com/tizenbrew/iptv/MainActivity.java`
  - `android-app/app/src/main/res/xml/file_paths.xml`
  - `android-app/app/src/main/res/values/colors.xml`
- Modify: `.github/workflows/build-apk.yml`

- [ ] **Step 1: Create `android-app/` build configuration files**
Create `build.gradle`, `settings.gradle`, `gradle.properties`, and `app/build.gradle` with compileSdk 34, minSdk 21, Media3 ExoPlayer 1.1.1, and buildConfig enabled.

- [ ] **Step 2: Create `AndroidManifest.xml`, `file_paths.xml`, and `colors.xml`**
Add package permissions (`INTERNET`, `ACCESS_NETWORK_STATE`, `REQUEST_INSTALL_PACKAGES`), Leanback launcher intent filter, and `FileProvider`.

- [ ] **Step 3: Create `MainActivity.java` in `android-app/app/src/main/java/com/tizenbrew/iptv/`**
Place the verified `MainActivity.java` with `SurfaceView`, `DefaultLoadControl` (15s/30s buffer), `PlayerBridge`, and background update thread.

- [ ] **Step 4: Clean up `.github/workflows/build-apk.yml`**
Remove all heredoc `cat > ... << 'EOF'` steps. Replace with clean steps targeting `android-app/`.

- [ ] **Step 5: Commit Task 1**
```bash
git add android-app/ .github/workflows/build-apk.yml
git commit -m "refactor(android): extract standalone android-app project from CI workflow"
```

---

### Task 2: Refactor `inject.js` with Strict ES5 & Tizen 3 Compatibility

**Files:**
- Modify: `android/dist/inject.js`
- Test: `tests/inject.test.mjs`

- [ ] **Step 1: Add Tizen 3.0 ES5 strictness check to `tests/inject.test.mjs`**
Write a test that verifies `inject.js` contains no arrow functions, no `async`/`await`, no optional chaining `?.`, and preserves Tizen keycode 10009.

- [ ] **Step 2: Run test to verify status**
Run: `node --test tests/inject.test.mjs`

- [ ] **Step 3: Refactor `android/dist/inject.js` with semantic names and clean structure**
Rename single-letter variables to descriptive names (`channelList`, `playChannel`, `navigateChannel`, etc.) while adhering strictly to ES5.

- [ ] **Step 4: Run tests to verify all tests pass**
Run: `node --test tests/landing.test.mjs tests/inject.test.mjs`

- [ ] **Step 5: Commit Task 2**
```bash
git add android/dist/inject.js tests/inject.test.mjs
git commit -m "refactor(player): unslop inject.js with semantic names and strict ES5 Tizen 3 compatibility"
```

---

### Task 3: Push & CI Verification

- [ ] **Step 1: Push changes to `origin main`**
- [ ] **Step 2: Monitor GitHub Actions build run to verify APK builds cleanly**
