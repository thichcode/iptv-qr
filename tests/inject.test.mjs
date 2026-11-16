import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const injectCode = await readFile(new URL('android/dist/inject.js', root), 'utf8');

test('inject.js defines transparent glassmorphic overlay for TV UI', () => {
  assert.match(injectCode, /#list\{[^}]*background:\s*rgba\(/i, 'expected #list to have semi-transparent background');
  assert.match(injectCode, /backdrop-filter:\s*blur/i, 'expected backdrop-filter blur on channel list or overlays');
  assert.match(injectCode, /#player-wrap\{[^}]*position:\s*absolute/i, 'expected #player-wrap to be positioned absolute across viewport');
});

test('inject.js contains 10-second channel switch debounce logic', () => {
  assert.match(injectCode, /channelSwitchTimer/, 'expected channelSwitchTimer variable');
  assert.match(injectCode, /10000|1e4/, 'expected 10s duration for channel switch debounce');
  assert.match(injectCode, /window\._onUpdateStatus/, 'expected window._onUpdateStatus listener');
});

test('inject.js contains auto-resume, channel recall, and clock overlay', () => {
  assert.match(injectCode, /lastChannelIdx/, 'expected lastChannelIdx for auto-resume');
  assert.match(injectCode, /prevChannelIdx/, 'expected prevChannelIdx for channel recall');
  assert.match(injectCode, /id="clock"/, 'expected #clock element for live clock display');
});

test('inject.js adheres strictly to ES5 for Samsung Tizen 3.0 (Chromium 47) compatibility', () => {
  // Disallow arrow functions
  assert.doesNotMatch(injectCode, /=>/, 'inject.js must not contain ES6 arrow functions (=>)');
  // Disallow async functions / await expressions
  assert.doesNotMatch(injectCode, /\basync\s+function|\bawait\s+/, 'inject.js must not contain async/await');
  // Disallow optional chaining and nullish coalescing
  assert.doesNotMatch(injectCode, /\?\./, 'inject.js must not contain optional chaining (?.)');
  assert.doesNotMatch(injectCode, /\?\?/, 'inject.js must not contain nullish coalescing (??)');
  // Disallow modern String methods incompatible with older webviews
  assert.doesNotMatch(injectCode, /\.padStart\(/, 'inject.js must not use padStart');
  assert.doesNotMatch(injectCode, /\.includes\(/, 'inject.js must not use .includes()');
});

test('inject.js uses semantic, self-documenting function names', () => {
  assert.match(injectCode, /function playChannel\(/, 'expected playChannel function');
  assert.match(injectCode, /function navigateChannel\(/, 'expected navigateChannel function');
  assert.match(injectCode, /function fetchPlaylist\(/, 'expected fetchPlaylist function');
  assert.match(injectCode, /function parseM3U\(/, 'expected parseM3U function');
  assert.match(injectCode, /function enterFullscreen\(/, 'expected enterFullscreen function');
  assert.match(injectCode, /function exitFullscreen\(/, 'expected exitFullscreen function');
  assert.match(injectCode, /function resetFullscreenTimer\(/, 'expected resetFullscreenTimer function');
  assert.match(injectCode, /function focusCurrentChannel\(/, 'expected focusCurrentChannel function');
  assert.match(injectCode, /function setStatus\(/, 'expected setStatus function');
  assert.match(injectCode, /function setNowPlaying\(/, 'expected setNowPlaying function');
  assert.match(injectCode, /function registerTizenKeys\(/, 'expected registerTizenKeys function');
  assert.match(injectCode, /function initApp\(/, 'expected initApp function');
});

test('inject.js maintains Tizen key codes and player fallbacks', () => {
  assert.match(injectCode, /10009:\s*["']Escape["']/, 'expected keycode 10009 mapped to Escape');
  assert.match(injectCode, /tvinputdevice\.registerKey/, 'expected tizen.tvinputdevice.registerKey call');
  assert.match(injectCode, /window\.NativePlayer/, 'expected window.NativePlayer check for ExoPlayer');
  assert.match(injectCode, /Hls/, 'expected Hls fallback for Tizen');
  assert.match(injectCode, /mpegts/, 'expected mpegts fallback for Tizen');
});
