# Design: Android TV Web App + Landing Page

## Overview

Extend `tizenbrew-iptv` with an Android TV web app version and a full marketing landing page deployable to Vercel.

## Components

### 1. Android TV Web App

**Approach**: Reuse `inject.js` from Tizen version, delivered as WebView APK.

**File structure**:
```
android/
  index.html          # Entry point (identical to Tizen)
  dist/
    inject.js         # Copied from Tizen, conditional Tizen API checks
```

**Key changes in inject.js**:
- Wrap `tizen.tvinputdevice` calls in `try/catch` with existence check (already done in code)
- No other changes needed - D-Pad, QR setup, channel list all work cross-platform

**Delivery**: WebView APK wraps `android/index.html` + `android/dist/inject.js`

### 2. Landing Page

**Tech**: Vanilla HTML/CSS/JS, dark mode, deploy to Vercel.

**File structure**:
```
landing/
  index.html
  style.css
  script.js
```

**Sections** (top to bottom):
1. **Hero** - App name, tagline, mockup TV image, CTA buttons (npm install / APK download)
2. **Features** - QR Setup, Channel Groups, D-Pad Control, Search, Fullscreen (icon + text cards)
3. **How it works** - 3-step visual: Scan QR → Enter URL → Watch
4. **Comparison table** - vs TiviMate, OTT Navigator, OTTPlayer (columns: Feature, tizenbrew-iptv, others)
5. **Testimonials** - 3-4 placeholder cards
6. **Download** - Two cards: Tizen (npm) + Android TV (APK download)
7. **Footer** - GitHub link, npm link, MIT license

**Design tokens**:
- Background: `#1a1a1a`
- Card background: `#2a2a2a`
- Accent: `#ffd600`
- Text: `#fff`
- Muted text: `#888`
- Font: system fonts (-apple-system, BlinkMacSystemFont, Segoe UI)

## Data flow

```
User phone → QR scan → Cloudflare Worker → TV polls → playlist saved → channels load
```

Same as Tizen version, no changes to setup flow.

## Out of scope

- No native Android TV code (Kotlin/Java) - WebView wrapper only
- No backend changes - reuse existing Cloudflare Worker
- No new features for the IPTV player itself
