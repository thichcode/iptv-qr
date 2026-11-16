# Design Spec: Codebase Unslop & Tizen 3.0 Safe Refactoring

**Date**: 2026-11-16  
**Status**: Approved

---

## 1. Overview & Goals

This refactoring aims to eliminate tech debt and "AI slop" while strictly guaranteeing 100% backward compatibility with **Samsung Tizen 3.0 (Chromium 47, 2017)** and **Android TV (API 21+)**:

1. **Extract Android Native Project**: Move all Android project files out of inline heredoc `cat > ... << 'EOF'` scripts inside `.github/workflows/build-apk.yml` into a real, standalone `android-app/` project in the repository.
2. **Refactor `inject.js` for Readability (Strict ES5)**:
   - Rename single-letter variable names (`i`, `p`, `y`, `L`, `D`, `d`, etc.) to clear, self-documenting identifiers (`channelList`, `currentChannelIndex`, `playChannel`, `navigateChannel`, `highlightChannelInDOM`, `setStatusText`, etc.).
   - Retain 100% ES5 syntax (`var`, `function() {}`, `indexOf`) without ES6+ features (`async/await`, `?.`, `??`, arrow functions, `padStart`) that break Chromium 47 / Tizen 3.0.
3. **Preserve Tizen 3.0 Playback Stack**:
   - Keep `hls.js@0.14.17` and `mpegts.js@1.7.3` for Tizen 3.0 since Tizen does not have `window.NativePlayer`.
   - Keep Samsung Tizen TV remote keycodes (`10009`, `10190`, `10252`, `405`, `427`, `428`) and `tizen.tvinputdevice` registration.

---

## 2. Architecture & File Structure

### 2.1 Standalone Android Project (`android-app/`)
```text
android-app/
├── build.gradle
├── settings.gradle
├── gradle.properties
└── app/
    ├── build.gradle
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/com/tizenbrew/iptv/
        │   └── MainActivity.java
        └── res/
            ├── values/colors.xml
            ├── xml/file_paths.xml
            └── mipmap-{mdpi,hdpi,xhdpi,xxhdpi}/ic_launcher.png
```
The CI workflow `.github/workflows/build-apk.yml` will simply:
- Checkout repository
- Setup JDK 17
- Copy web assets from `android/` into `android-app/app/src/main/assets/`
- Run `./gradlew assembleDebug` directly inside `android-app/`
- Publish release and APK artifact

### 2.2 `android/dist/inject.js` Semantic Refactoring (Strict ES5)
Key renames:
- `I` -> `savedPlaylistUrl`
- `W` -> `SETUP_SERVICE_URL`
- `LS` -> `STORAGE_KEY_PLAYLIST`
- `LS_LAST_CH` -> `STORAGE_KEY_LAST_CHANNEL`
- `i` -> `channelList`
- `p` -> `currentChannelIndex`
- `prevChannelIdx` -> `previousChannelIndex`
- `channelSwitchTimer` -> `channelSwitchTimer`
- `a` -> `videoElement`
- `h` -> `channelListElement`
- `T` -> `nowPlayingElement`
- `k` -> `statusElement`
- `y(e)` -> `playChannel(index)`
- `L(e)` -> `navigateChannel(offset)`
- `D(e)` -> `highlightChannelInDOM(index)`
- `d(e)` -> `setStatus(text)`
- `E(e)` -> `setNowPlaying(text)`
- `H()` -> `enterFullscreen()`
- `F()` -> `exitFullscreen()`
- `g()` -> `resetFullscreenTimer()`
- `x()` -> `focusCurrentChannel()`
- `X()` -> `togglePlayPause()`
- `K()` -> `fetchPlaylist()`
- `z(e)` -> `parseM3U(content)`
- `_()` -> `renderChannelList()`
- `G(e)` -> `handleKeyDown(event)`
- `J()` -> `registerTizenKeys()`
- `O()` -> `initApp()`

---

## 3. Testing & Compatibility Verification
- Run tests (`tests/landing.test.mjs` and `tests/inject.test.mjs`).
- Add AST / regex linter test in `tests/inject.test.mjs` verifying:
  - No `async`/`await` keywords.
  - No arrow functions `=>`.
  - No optional chaining `?.`.
  - All Tizen 3 keycodes preserved.
