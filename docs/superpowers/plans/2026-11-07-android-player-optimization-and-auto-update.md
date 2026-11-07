# Android TV Player Optimization & Auto-Updater Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate screen tearing on Android TV by switching from `TextureView` to `SurfaceView`, add a 10s debounce on remote channel navigation, redesign the channel list and bars into a transparent overlay, and add a background auto-update downloader in the APK build.

**Architecture:**
1. In `MainActivity.java` (generated in `.github/workflows/build-apk.yml`), replace `TextureView` with `SurfaceView`, configure `FileProvider` for package installation, and launch a background thread on startup to query GitHub Releases API for APK updates and download in the background.
2. In `android/dist/inject.js`, make the player fullscreen underneath while redesigning the header, footer, and channel list into semi-transparent overlays (`rgba(0, 0, 0, 0.55)` + blur).
3. In `android/dist/inject.js`, implement a 10-second debounce timer on `ArrowUp`/`ArrowDown`/`ChannelUp`/`ChannelDown` keys so navigation is instantaneous while stream loading is delayed by 10s (or executed immediately on `Enter`/`OK`).

**Tech Stack:**
- Android SDK (Java 17, ExoPlayer/Media3, SurfaceView, FileProvider)
- Vanilla JS (ES5/ES6 compatible for TV WebViews), CSS3 glassmorphism & overlays
- GitHub Actions CI/CD for APK building

**Spec:** `docs/superpowers/specs/2026-11-07-android-player-optimization-and-auto-update-design.md`

## Global Constraints
- Target platform: Android TV (API 21+) and Samsung Tizen web app.
- No external heavy dependencies in JS; keep pure vanilla JavaScript.
- Maintain backward compatibility with web player and Tizen device input.
- APK build workflow must remain clean and autonomous in GitHub Actions.

## Review Focus
- Rapid arrow key presses must not trigger multiple concurrent stream requests.
- Pressing `Enter` must immediately trigger playback and clear any pending 10s debounce timer.
- `SurfaceView` must not occlude or get occluded improperly by transparent `WebView`.
- Background update thread must handle network failures or invalid GitHub API responses gracefully without crashing.
- FileProvider URI creation must adhere to Android 7+ (API 24+) permission requirements.

---

### Task 1: Fix Screen Tearing & Add Auto-Updater Subsystem in `.github/workflows/build-apk.yml`

**Files:**
- Modify: `.github/workflows/build-apk.yml`

**Interfaces:**
- Produces: `MainActivity.java` with `SurfaceView` video output, `FileProvider` config, and background update checker/downloader.
- Bridge callback: `window._onUpdateStatus(msg)` sent to WebView.

- [ ] **Step 1: Add `res/xml/file_paths.xml` creation to GitHub Actions workflow**
Create directory `android-project/app/src/main/res/xml` and file `file_paths.xml` with `<paths><external-files-path name="apk_updates" path="." /></paths>`.

- [ ] **Step 2: Add `REQUEST_INSTALL_PACKAGES` permission and `FileProvider` to `AndroidManifest.xml`**
In `build-apk.yml`, declare `<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />` and the `<provider>` definition pointing to `androidx.core.content.FileProvider`.

- [ ] **Step 3: Update `MainActivity.java` to use `SurfaceView` instead of `TextureView`**
Replace `TextureView` with `SurfaceView`, call `player.setVideoSurfaceView(surfaceView)`, and ensure `surfaceView.getHolder().setKeepScreenOn(true)`.

- [ ] **Step 4: Implement `checkAndDownloadUpdate()` in `MainActivity.java`**
Implement background thread on `onCreate` to:
1. Query `https://api.github.com/repos/thichcode/iptv-qr/releases/latest`.
2. Compare tag with `BuildConfig.VERSION_NAME`.
3. If newer, stream download APK to `getExternalFilesDir(null)/update.apk`.
4. Launch install intent via `FileProvider.getUriForFile`.

- [ ] **Step 5: Verify build workflow structure**
Ensure all YAML tags and script escapes in `build-apk.yml` are well-formed.

- [ ] **Step 6: Commit**
```bash
git add .github/workflows/build-apk.yml
git commit -m "feat: switch to SurfaceView for tearing fix and add auto-updater to APK workflow"
```

---

### Task 2: 10-Second Channel Switch Debounce & Transparent Overlay in `android/dist/inject.js`

**Files:**
- Modify: `android/dist/inject.js`

**Interfaces:**
- Consumes: Keydown events (`ArrowUp`, `ArrowDown`, `Enter`, `ChannelUp`, `ChannelDown`, numeric keys).
- Consumes: `window._onUpdateStatus(msg)` from native Android container.
- Produces: Transparent UI overlay, debounced channel streaming.

- [ ] **Step 1: Write tests for channel debounce logic and UI overlay styles**
Create `tests/inject.test.mjs` verifying:
- Channel change debounce timer is set to 10s on navigation key.
- Cancel timer on subsequent navigation key.
- Immediate play on `Enter`.
- CSS contains transparent overlay and fullscreen dimensions.

- [ ] **Step 2: Run test to verify initial failure**
Run: `node tests/inject.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Update CSS styling in `M()` inside `android/dist/inject.js`**
- Set `#player-wrap` to fullscreen absolute position with transparent background.
- Set `#list` to right-side floating panel with `rgba(18, 18, 18, 0.65)`, `backdrop-filter: blur(10px)`.
- Set `header` and `#bar` to gradient transparent headers.

- [ ] **Step 4: Implement 10-second debounce in channel navigation functions (`L`, `y`, `G`)**
- Introduce `var channelSwitchTimer = null;`.
- In `L(e)`: move focus and update active class in DOM immediately, show countdown in `#st`, reset `channelSwitchTimer` to execute `y(idx)` after 10,000ms.
- In `Enter`: clear `channelSwitchTimer` and call `y(p)` immediately.

- [ ] **Step 5: Add `window._onUpdateStatus` listener**
Update `#st` footer text when `window._onUpdateStatus(msg)` is called.

- [ ] **Step 6: Run test to verify it passes**
Run: `node tests/inject.test.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**
```bash
git add android/dist/inject.js tests/inject.test.mjs
git commit -m "feat: implement 10s channel debounce and transparent UI overlay"
```

---

### Task 3: End-to-End Integration Verification

**Files:**
- Test: `tests/inject.test.mjs`
- Verify: `.github/workflows/build-apk.yml`

- [ ] **Step 1: Run all tests in repository**
Run: `node tests/landing.test.mjs` and `node tests/inject.test.mjs`.
Expected: All tests pass.

- [ ] **Step 2: Commit any final cleanup**
```bash
git commit -m "chore: complete player optimization, transparent UI, and auto-updater"
```
