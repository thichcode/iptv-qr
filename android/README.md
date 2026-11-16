# TizenBrew IPTV

IPTV app module for TizenBrew with QR-based playlist setup.

## Install

```bash
npm i tizenbrew-iptv
```

## Features

- No bundled playlist URL
- QR setup flow for entering an M3U URL from a phone
- Saves the submitted playlist URL in TV `localStorage`
- Loads the saved playlist automatically on later launches
- Channel list, search, and TV remote friendly controls

## Controls

- Up/Down: move channel list
- Enter: play selected channel
- Play/Pause: toggle playback
- Stop: stop stream
- Yellow key: change playlist

## Maintainer Publish

```bash
npm run pack:check
npm run publish:public
```
