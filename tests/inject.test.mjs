import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const injectCode = await readFile(new URL('android/dist/inject.js', root), 'utf8');

test('inject.js defines transparent glassmorphic overlay for TV UI', () => {
  // Check for transparent/rgba background in style definition
  assert.match(injectCode, /#list\{[^}]*background:\s*rgba\(/i, 'expected #list to have semi-transparent background');
  assert.match(injectCode, /backdrop-filter:\s*blur/i, 'expected backdrop-filter blur on channel list or overlays');
  assert.match(injectCode, /#player-wrap\{[^}]*position:\s*absolute/i, 'expected #player-wrap to be positioned absolute across viewport');
});

test('inject.js contains 10-second channel switch debounce logic', () => {
  // Check that channel switch timer and 10000ms (1e4 or 10000) debounce exists
  assert.match(injectCode, /channelSwitchTimer/, 'expected channelSwitchTimer variable');
  assert.match(injectCode, /10000|1e4/, 'expected 10s duration for channel switch debounce');
  assert.match(injectCode, /window\._onUpdateStatus/, 'expected window._onUpdateStatus listener');
});
