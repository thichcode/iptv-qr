# IPTV QR

Live TV on Android TV & Samsung Tizen. Zero typing.

Scan a QR code with your phone, paste your M3U playlist URL, and watch on your TV.

## Platforms

| Platform | Install method |
|----------|---------------|
| **Android TV** | [Download APK](https://github.com/thichcode/iptv-qr/releases/latest) (sideload) |
| **Samsung Tizen** | [TizenBrew Module Manager](https://tizenbrew.com) |

## How it works

1. Open IPTV QR on your TV — a 6-character code and QR code appear.
2. Scan the QR with your phone, or visit the setup URL manually.
3. Enter your M3U playlist URL on your phone.
4. The TV loads your channels — no remote typing required.

## Features

- QR-based phone setup — no on-screen keyboard
- M3U playlist support with channel groups
- D-Pad remote navigation
- Vietnamese channel grouping (VTV, HTV, SCTV, THVL, BTV, etc.)
- Fullscreen immersive playback
- Automatic setup code polling (3s interval)
- localStorage persistence for playlist URL
- Open source (MIT)

## Build from source

### Android TV APK

The APK is auto-built by GitHub Actions on every push to `android/`. To build locally:

```bash
# Requires Android SDK, JDK 17
git clone https://github.com/thichcode/iptv-qr.git
cd iptv-qr

# Create Android project structure
mkdir -p android-project/app/src/main/java/com/tizenbrew/iptv
mkdir -p android-project/app/src/main/assets
mkdir -p android-project/app/src/main/res/values
mkdir -p android-project/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi}

# Copy the web assets
cp -r android/* android-project/app/src/main/assets/

# Build with Gradle
cd android-project
gradle wrapper --gradle-version 8.4
./gradlew assembleDebug
```

The output APK will be at `android-project/app/build/outputs/apk/debug/app-debug.apk`.

### Samsung Tizen

Install via [TizenBrew Module Manager](https://tizenbrew.com) on your Samsung TV.

## Project structure

```
├── android/                    # Android TV web app (WebView)
│   ├── index.html              # Entry point
│   └── dist/inject.js          # IPTV player logic + QR generation
├── landing/                    # Marketing landing page (vercel)
│   ├── index.html
│   ├── style.css
│   └── script.js
├── tests/                      # Structural & behavioral tests
│   └── landing.test.mjs
└── .github/workflows/
    └── build-apk.yml           # CI: builds APK + creates release
```

## Development

The Android TV app is a web-based WebView — `inject.js` runs in the WebView and creates the full TV UI via DOM. The same script is reused from the Tizen version with platform detection.

```bash
# Run landing page tests
node --test tests/landing.test.mjs

# Syntax check
node --check landing/script.js
```

## License

MIT
