# Design Spec: Android TV Player Optimization & In-App Auto-Updater

**Date**: 2026-11-07  
**Status**: Approved (Approach 1)

---

## 1. Overview & Goals

This specification addresses three user experience enhancements and one infrastructure capability for the IPTV QR Android TV application:

1. **Eliminate Screen Tearing**: Replace `TextureView` with `SurfaceView` in `MainActivity.java` so that ExoPlayer outputs directly through a hardware VSYNC-synchronized surface.
2. **Channel Switching 10s Delay**: Add a 10-second debounce when browsing channels via Up/Down navigation keys, highlighting the target channel immediately while delaying stream buffering until navigation stops for 10 seconds (or immediately on Enter/OK).
3. **Transparent Floating UI**: Redesign the channel list, header, and footer into semi-transparent overlays (`rgba(0, 0, 0, 0.55)`, blur backdrop) on top of the fullscreen video layer, reducing screen occlusion.
4. **Native Background Auto-Updater**: On app launch, query the GitHub Releases API for the latest version tag. If newer, download the APK in the background and launch the Android package installer prompt via `FileProvider`.

---

## 2. Technical Architecture & Component Design

### 2.1 Video Rendering Pipeline (Fix Screen Tearing)
* **Problem**: `TextureView` runs through the standard View hierarchy and compositor pass, leading to dropped frames, jitter, and tearing during fast camera pans on Android TV hardware (Amlogic/MediaTek SOCs).
* **Fix**:
  - In `MainActivity.java`, instantiate `android.view.SurfaceView` instead of `TextureView`.
  - Add `surfaceView` at index 0 of the root `FrameLayout`, beneath the transparent `WebView`.
  - Configure `surfaceView.getHolder().setKeepScreenOn(true)`.
  - Bind ExoPlayer via `player.setVideoSurfaceView(surfaceView)`.
  - When channels load or play, `SurfaceView` stays hardware-composited at 60Hz VSYNC without tearing.

### 2.2 Channel Switch Navigation with 10s Debounce
* **State Management in `inject.js`**:
  - Introduce `channelSwitchTimer` (stores `setTimeout` ID, duration: 10,000ms).
  - Track `focusedIdx` (channel highlighted in list) vs `activeIdx` (channel currently streaming).
* **Navigation Behavior**:
  - `ArrowUp` / `ArrowDown` / `ChannelUp` / `ChannelDown`:
    - Move DOM focus and highlight class `.ch.focused` to the target channel immediately.
    - Scroll channel item into view.
    - Cancel any existing `channelSwitchTimer`.
    - Update footer `#st` text: `"Auto switch in 10s: [Channel Name]"`.
    - Start timer: `channelSwitchTimer = setTimeout(() => { y(focusedIdx); }, 10000)`.
  - `Enter` / `OK`:
    - Immediately clear `channelSwitchTimer`.
    - Call `y(focusedIdx)` to load and stream the highlighted channel instantly.
  - Number keys (`0`-`9`):
    - Digits buffer for 1s (`w`), then select channel item, trigger 10s countdown, or switch immediately on Enter.

### 2.3 Transparent Overlay UI Redesign
* **CSS & Layout Adjustments in `inject.js`**:
  - `#app`: Fullscreen container (`100vw` x `100vh`), `background: transparent`.
  - `#player-wrap`: Sized `100vw` x `100vh`, `position: absolute; inset: 0; background: transparent;`.
  - `#player` (HTML video tag fallback): `width: 100%; height: 100%; object-fit: contain; background: transparent;`.
  - `header`: Position absolute at top, height ~48px, `background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)`, padding `10px 24px`.
  - `#bar`: Position absolute at bottom, height ~48px, `background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)`, padding `10px 24px`.
  - `#list`: Position absolute on the right side (`top: 50px; bottom: 50px; right: 0; width: 280px`), `background: rgba(18, 18, 18, 0.65)`, `backdrop-filter: blur(10px)`, `border-left: 1px solid rgba(255, 255, 255, 0.12)`.
  - `.ch`: Font size 20px, compact padding (10px 14px), transparent background.
  - `.ch.on`: Highlighted with `border-left: 4px solid #ffd600` and `background: rgba(255, 255, 255, 0.08)`.
  - `.ch:focus`: Outline `2px solid #ffd600`, `background: rgba(255, 214, 0, 0.25)`.

### 2.4 Native Background Auto-Updater Subsystem
* **Permissions & Provider in `.github/workflows/build-apk.yml`**:
  - Permission: `<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />`.
  - Provider in `AndroidManifest.xml`:
    ```xml
    <provider
        android:name="androidx.core.content.FileProvider"
        android:authorities="${applicationId}.fileprovider"
        android:exported="false"
        android:grantUriPermissions="true">
        <meta-data
            android:name="android.support.FILE_PROVIDER_PATHS"
            android:resource="@xml/file_paths" />
    </provider>
    ```
  - `file_paths.xml`: `<paths><external-files-path name="apk_updates" path="." /></paths>`.
* **Updater Thread in `MainActivity.java`**:
  - `checkAndDownloadUpdate()` runs on a daemon background thread after activity creation.
  - Fetches GitHub API: `https://api.github.com/repos/thichcode/iptv-qr/releases/latest`.
  - Parses JSON: `tag_name` (e.g. `v1.1.25`) and finds asset ending with `.apk` with its `browser_download_url`.
  - Compares `tag_name` with `BuildConfig.VERSION_NAME` / current version code.
  - If a newer release exists:
    - Informs UI via JS: `js("window._onUpdateStatus && window._onUpdateStatus('Found update " + tag + ", downloading in background...')")`.
    - Downloads APK stream into `new File(getExternalFilesDir(null), "update.apk")`.
    - On complete:
      - Informs UI via JS: `js("window._onUpdateStatus && window._onUpdateStatus('Update ready to install')")`.
      - Creates `Intent(Intent.ACTION_VIEW)` with `FileProvider.getUriForFile(...)`, `FLAG_GRANT_READ_URI_PERMISSION`, `FLAG_ACTIVITY_NEW_TASK`, MIME type `application/vnd.android.package-archive`.
      - Starts activity to open system installer prompt.

---

## 3. Files Impacted

1. `.github/workflows/build-apk.yml`:
   - Add `file_paths.xml` creation step.
   - Update `AndroidManifest.xml` (permissions & `FileProvider`).
   - Update `MainActivity.java` (`SurfaceView` replacement, `checkAndDownloadUpdate` background worker, and `_onUpdateStatus` JS bridge).
2. `android/dist/inject.js`:
   - Updated CSS for transparent glassmorphic overlays.
   - 10-second debounced channel navigation.
   - Handling `window._onUpdateStatus` for subtle notifications in `#st`.

---

## 4. Verification & Testing Plan
* **Code verification**:
  - Verify syntax and completeness of Java in GitHub Actions workflow script.
  - Verify `inject.js` JavaScript syntax, key bindings, and debounced timer behavior.
* **Functional checks**:
  - Up/Down keys move channel selector immediately without video interruption until 10s timeout expires.
  - Enter key switches stream immediately and clears pending 10s timer.
  - UI overlays are transparent with visible video underneath.
  - Background updater parses release tag, downloads APK, and triggers package installer safely.
