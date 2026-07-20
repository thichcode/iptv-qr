import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('landing/index.html', root), 'utf8');
const css = await readFile(new URL('landing/style.css', root), 'utf8');
const script = await readFile(new URL('landing/script.js', root), 'utf8');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractElementByClass(className) {
  const escapedClass = escapeRegExp(className);
  const classValue = `(?:"[^"]*\\b${escapedClass}\\b[^"]*"|'[^']*\\b${escapedClass}\\b[^']*')`;
  const match = html.match(
    new RegExp(`<div\\b(?=[^>]*\\bclass\\s*=\\s*${classValue})[^>]*>[\\s\\S]*?<\\/div>`, 'i'),
  );
  assert.ok(match, `missing .${className} block`);
  return match[0];
}

function extractElementById(tagName, id) {
  const escapedId = escapeRegExp(id);
  const match = html.match(
    new RegExp(
      `<${tagName}\\b(?=[^>]*\\bid\\s*=\\s*(["'])${escapedId}\\1)[^>]*>[\\s\\S]*?<\\/${tagName}>`,
      'i',
    ),
  );
  assert.ok(match, `missing #${id} ${tagName}`);
  return match[0];
}

function assertLink(scope, destination, labels = []) {
  const hrefPattern = new RegExp(
    `\\bhref\\s*=\\s*(["'])${escapeRegExp(destination)}\\1`,
    'i',
  );
  const anchors = [...scope.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const found = anchors.some(([, attributes, content]) => {
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return hrefPattern.test(attributes) && labels.every((label) => text.includes(label));
  });
  assert.ok(found, `missing link to ${destination} with labels: ${labels.join(', ')}`);
}

function elementsWithAttribute(scope, attribute) {
  return [
    ...scope.matchAll(
      new RegExp(
        `<([a-z][\\w-]*)\\b[^>]*\\b${attribute}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?[^>]*>`,
        'gi',
      ),
    ),
  ];
}

function extractCssRule(selector, source = css) {
  const match = source.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, 's'));
  assert.ok(match, `missing ${selector} CSS rule`);
  return match[1];
}

class FakeClassList {
  constructor(classes = []) {
    this.classes = new Set(classes);
  }

  add(...classes) {
    classes.forEach((className) => this.classes.add(className));
  }

  contains(className) {
    return this.classes.has(className);
  }

  toggle(className, force) {
    const enabled = force === undefined ? !this.contains(className) : force;
    if (enabled) this.classes.add(className);
    else this.classes.delete(className);
    return enabled;
  }
}

class FakeElement {
  constructor({ attributes = {}, classes = [], hidden = false, textContent = '' } = {}) {
    this.attributes = new Map(Object.entries(attributes));
    this.classList = new FakeClassList(classes);
    this.focusCount = 0;
    this.hidden = hidden;
    this.href = attributes.href ?? '';
    this.listeners = new Map();
    this.queries = new Map();
    this.queryLists = new Map();
    this.textContent = textContent;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type, event = {}) {
    for (const listener of this.listeners.get(type) ?? []) listener({ target: this, ...event });
  }

  focus() {
    this.focusCount += 1;
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  querySelector(selector) {
    return this.queries.get(selector) ?? null;
  }

  querySelectorAll(selector) {
    return this.queryLists.get(selector) ?? [];
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  setAttribute(name, value) {
    const stringValue = String(value);
    this.attributes.set(name, stringValue);
    if (name === 'href') this.href = stringValue;
  }
}

async function runLandingScript({ fetchResponse, legacyMotionListener = false, reducedMotion = false } = {}) {
  const menuToggle = new FakeElement({
    attributes: { 'aria-controls': 'primary-navigation', 'aria-expanded': 'false' },
  });
  const nav = new FakeElement({ classes: ['site-nav'] });
  nav.queryLists.set('a', []);

  const channelOne = new FakeElement({
    attributes: { 'aria-pressed': 'true' },
    classes: ['channel-row', 'is-active'],
  });
  channelOne.queries.set('strong', new FakeElement({ textContent: 'Channel 01' }));
  channelOne.queries.set('small', new FakeElement({ textContent: 'News' }));
  const channelTwo = new FakeElement({
    attributes: { 'aria-pressed': 'false' },
    classes: ['channel-row'],
  });
  channelTwo.queries.set('strong', new FakeElement({ textContent: 'Channel 02' }));
  channelTwo.queries.set('small', new FakeElement({ textContent: 'Sports' }));
  const channelButtons = [channelOne, channelTwo];
  const cycleToggle = new FakeElement({
    attributes: { 'aria-pressed': 'false' },
    hidden: true,
    textContent: 'Pause channel preview',
  });
  const nowPlayingName = new FakeElement({ textContent: 'Channel 01' });
  const nowPlayingCategory = new FakeElement({ textContent: 'News' });
  const productDemo = new FakeElement();
  const releaseLabels = [
    new FakeElement({ textContent: 'View releases' }),
    new FakeElement({ textContent: 'View releases' }),
  ];
  const releaseLinks = [
    new FakeElement({ attributes: { href: 'https://github.com/thichcode/iptv-qr/releases/latest' } }),
    new FakeElement({ attributes: { href: 'https://github.com/thichcode/iptv-qr/releases/latest' } }),
  ];

  const documentListeners = new Map();
  const documentElement = new FakeElement();
  const document = {
    documentElement,
    hidden: false,
    addEventListener(type, listener) {
      const listeners = documentListeners.get(type) ?? [];
      listeners.push(listener);
      documentListeners.set(type, listeners);
    },
    dispatch(type, event = {}) {
      for (const listener of documentListeners.get(type) ?? []) listener(event);
    },
    getElementById(id) {
      return id === 'primary-navigation' ? nav : null;
    },
    querySelector(selector) {
      return new Map([
        ['[data-menu-toggle]', menuToggle],
        ['[data-now-playing-name]', nowPlayingName],
        ['[data-now-playing-category]', nowPlayingCategory],
        ['[data-channel-cycle-toggle]', cycleToggle],
        ['.product-demo', productDemo],
      ]).get(selector) ?? null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-channel]') return channelButtons;
      if (selector === '[data-release-label]') return releaseLabels;
      if (selector === '[data-apk-download]') return releaseLinks;
      return [];
    },
  };

  const motionListeners = [];
  const motionQuery = { matches: reducedMotion };
  if (legacyMotionListener) {
    motionQuery.addListener = (listener) => motionListeners.push(listener);
  } else {
    motionQuery.addEventListener = (type, listener) => {
      if (type === 'change') motionListeners.push(listener);
    };
  }

  const observers = [];
  class FakeIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      this.targets = [];
      observers.push(this);
    }

    observe(target) {
      this.targets.push(target);
    }

    unobserve(target) {
      this.targets = this.targets.filter((candidate) => candidate !== target);
    }

    trigger(target, isIntersecting = true) {
      this.callback([{ intersectionRatio: isIntersecting ? 1 : 0, isIntersecting, target }]);
    }
  }

  let intervalCalls = 0;
  let nextIntervalId = 1;
  const intervals = new Map();
  const context = {
    clearInterval(id) {
      intervals.delete(id);
    },
    document,
    fetch: async () => fetchResponse ?? { ok: false, status: 404 },
    IntersectionObserver: FakeIntersectionObserver,
    setInterval(callback) {
      intervalCalls += 1;
      const id = nextIntervalId;
      nextIntervalId += 1;
      intervals.set(id, callback);
      return id;
    },
    window: {
      IntersectionObserver: FakeIntersectionObserver,
      matchMedia: () => motionQuery,
    },
  };

  vm.runInNewContext(script, context);
  await new Promise((resolve) => setImmediate(resolve));

  return {
    channelButtons,
    cycleToggle,
    document,
    get intervalCalls() { return intervalCalls; },
    intervals,
    menuToggle,
    motionListeners,
    motionQuery,
    nowPlayingName,
    observers,
    productDemo,
    releaseLabels,
    releaseLinks,
  };
}

test('includes the required landing-page sections', () => {
  for (const id of ['product', 'setup', 'compare', 'install', 'faq']) {
    assert.match(html, new RegExp(`id\\s*=\\s*(["'])${id}\\1`));
  }
});

test('hero links equally to Android and Samsung installation paths', () => {
  const heroActions = extractElementByClass('hero-actions');
  assertLink(
    heroActions,
    'https://github.com/thichcode/iptv-qr/releases/latest',
    ['View releases', 'Android TV'],
  );
  assertLink(heroActions, '#samsung-install', ['Install module', 'Samsung Tizen']);
});

test('includes links to the project and its platform dependencies', () => {
  for (const url of [
    'https://github.com/thichcode/iptv-qr',
    'https://www.npmjs.com/package/tizenbrew-iptv',
    'https://github.com/reisxd/TizenBrew',
  ]) {
    assertLink(html, url);
  }
});

test('links MIT license evidence to npm without a dead repository license URL', () => {
  assert.ok(!html.includes('/blob/main/LICENSE'), 'found dead repository LICENSE link');
  assertLink(html, 'https://www.npmjs.com/package/tizenbrew-iptv', ['MIT license on npm']);
});

test('removes fake testimonials and old emoji icons', () => {
  for (const fakeTestimonial of ['What Users Say', 'User 1', 'User 2', 'User 3']) {
    assert.ok(!html.includes(fakeTestimonial), `found fake testimonial: ${fakeTestimonial}`);
  }
  assert.doesNotMatch(html, /[📱📺🎮🔍🖥💾]/u);
});

test('includes release hook and places interaction hooks on controls', () => {
  assert.match(html, /data-release-label(?:\s|=|>)/);

  const menuHooks = elementsWithAttribute(html, 'data-menu-toggle');
  assert.ok(menuHooks.length > 0, 'missing data-menu-toggle control');
  assert.ok(menuHooks.every((match) => match[1].toLowerCase() === 'button'));

  const channelBrowser = extractElementByClass('channel-browser');
  const channelHooks = elementsWithAttribute(channelBrowser, 'data-channel');
  assert.ok(channelHooks.length > 0, 'missing data-channel controls');
  assert.ok(channelHooks.every((match) => match[1].toLowerCase() === 'button'));
});

test('labels hero actions and channel controls as groups', () => {
  const heroActions = extractElementByClass('hero-actions');
  assert.match(heroActions, /<div\b(?=[^>]*\brole\s*=\s*(["'])group\1)(?=[^>]*\baria-label\s*=\s*(["'])Installation options\2)[^>]*>/i);

  const channelBrowser = extractElementByClass('channel-browser');
  assert.match(channelBrowser, /<div\b(?=[^>]*\brole\s*=\s*(["'])group\1)(?=[^>]*\baria-label\s*=\s*(["'])Example channel list\2)[^>]*>/i);
});

test('gives explicit Samsung TizenBrew navigation steps', () => {
  const samsungInstall = extractElementById('article', 'samsung-install');
  assert.match(samsungInstall, /Open TizenBrew on your TV/);
  assert.match(samsungInstall, /Open the Module Manager tab at the top/);
});

test('locks the hero heading to two accessible visual lines', () => {
  const heading = html.match(/<h1\b(?=[^>]*\bid\s*=\s*(["'])hero-title\1)[^>]*>([\s\S]*?)<\/h1>/i);
  assert.ok(heading, 'missing #hero-title heading');
  assert.match(
    heading[2],
    /^\s*<span>Live TV\.<\/span>\s*<span>Zero typing\.<\/span>\s*$/i,
  );
  assert.equal(
    heading[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    'Live TV. Zero typing.',
  );

  const lineRule = css.match(/\.hero-copy h1\s*>\s*span\s*\{([^}]*)\}/s);
  assert.ok(lineRule, 'missing hero heading line rule');
  assert.match(lineRule[1], /display:\s*block\b/);
  assert.match(lineRule[1], /white-space:\s*nowrap\b/);
});

test('gives the site brand at least a 44px interactive target', () => {
  const brandRule = extractCssRule('.site-brand');
  const minimum = brandRule.match(/min-(?:block-size|height):\s*(\d+(?:\.\d+)?)px\b/);
  assert.ok(minimum, 'missing pixel minimum size on .site-brand');
  assert.ok(Number(minimum[1]) >= 44, 'site brand target is smaller than 44px');
});

test('limits editorial eyebrows to three strategic placements', () => {
  const eyebrows = html.match(/class="eyebrow"/g) ?? [];
  assert.ok(eyebrows.length > 0, 'missing hero eyebrow');
  assert.ok(eyebrows.length <= 3, `found ${eyebrows.length} eyebrow elements`);
});

test('removes permanently hidden and unused hero and feature markup', () => {
  assert.doesNotMatch(html, /\bhero-note\b/);
  assert.doesNotMatch(html, /\bfeature-section-asymmetric\b/);
});

test('defines the Cinema Signal color and layout tokens', () => {
  for (const declaration of [
    '--color-bg: #080907',
    '--color-surface: #11130f',
    '--color-border: #292c25',
    '--color-text: #f4f5ef',
    '--color-muted: #85897f',
    '--color-accent: #d8ff45',
    '--color-on-accent: #15170f',
    '--color-on-accent-muted: #353b1c',
    '--content-width: 1180px',
  ]) {
    assert.ok(css.includes(declaration), `missing CSS token: ${declaration}`);
  }

  for (const literal of ['#15170f', '#353b1c']) {
    assert.equal(css.match(new RegExp(literal, 'g'))?.length, 1, `repeated ${literal} literal`);
  }
});

test('provides tablet and mobile layouts for the landing page', () => {
  assert.match(css, /@media\s*\(max-width:\s*1020px\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
});

test('provides a legacy viewport fallback immediately before dvh', () => {
  const heroRule = extractCssRule('.hero');
  assert.match(
    heroRule,
    /min-height:\s*calc\(100vh - var\(--header-height\)\);\s*min-height:\s*calc\(100dvh - var\(--header-height\)\);/,
  );
});

test('keeps the comparison table usable on narrow screens', () => {
  const wrapperRule = extractCssRule('.table-wrapper');
  assert.match(wrapperRule, /overflow-x:\s*auto\b/);
  assert.match(extractCssRule('.table-wrapper::after'), /content:\s*"Scroll to compare >"/);
});

test('keeps active channel focus visible against the accent background', () => {
  const activeFocusRule = extractCssRule('.channel-row.is-active:focus-visible');
  assert.doesNotMatch(activeFocusRule, /outline:[^;]*var\(--color-text\)/);
  assert.match(activeFocusRule, /outline:\s*\d+px\s+solid\s+var\(--color-on-accent\)/);
  assert.match(activeFocusRule, /outline-offset:\s*-?\d+px/);
});

test('defines selector-specific interactive states', () => {
  const menuOpenRule = extractCssRule('.site-nav.is-open');
  assert.match(menuOpenRule, /opacity:\s*1\b/);
  assert.match(menuOpenRule, /pointer-events:\s*auto\b/);
  assert.match(menuOpenRule, /transform:\s*translateY\(0\)/);
  assert.match(menuOpenRule, /visibility:\s*visible\b/);

  assert.match(extractCssRule('.platform-cta span'), /white-space:\s*nowrap\b/);
  assert.match(extractCssRule('.channel-row.is-active'), /background:\s*var\(--color-accent\)/);
  assert.match(extractCssRule('.site-nav a.is-active'), /color:\s*var\(--color-accent\)/);
});

test('documents and styles Task 3 reveal enhancement states', () => {
  assert.match(
    css,
    /\/\* Activated by script\.js as progressive enhancement\. \*\/\s*\[data-reveal\]\s*\{/,
  );
  const hiddenRule = extractCssRule('[data-reveal]');
  assert.match(hiddenRule, /opacity:\s*0\b/);
  assert.match(hiddenRule, /transform:\s*translateY\(24px\)/);

  const visibleRule = extractCssRule('[data-reveal].is-visible');
  assert.match(visibleRule, /opacity:\s*1\b/);
  assert.match(visibleRule, /transform:\s*translateY\(0\)/);
});

test('turns off motion when the user requests reduced motion', () => {
  const mediaStart = css.indexOf('@media (prefers-reduced-motion: reduce)');
  assert.notEqual(mediaStart, -1, 'missing reduced-motion media query');
  const reducedMotion = css.slice(mediaStart);

  assert.match(extractCssRule('html', reducedMotion), /scroll-behavior:\s*auto\b/);
  const universalRule = reducedMotion.match(/\*,\s*\*::before,\s*\*::after\s*\{([^}]*)\}/s);
  assert.ok(universalRule, 'missing reduced-motion universal rule');
  assert.match(universalRule[1], /animation:\s*none\s*!important/);
  assert.match(universalRule[1], /transition:\s*none\s*!important/);
});

test('keeps stable release fallbacks and provides dedicated update hooks', () => {
  const releaseUrl = 'https://api.github.com/repos/thichcode/iptv-qr/releases/latest';
  const releasePage = 'https://github.com/thichcode/iptv-qr/releases/latest';
  const buildStatus = 'https://github.com/thichcode/iptv-qr/actions/workflows/build-apk.yml';

  assert.ok(script.includes(`const releaseUrl = '${releaseUrl}';`), 'missing release API URL');
  assert.doesNotMatch(html, />\s*Latest release\s*</i);
  assert.doesNotMatch(html, /data-release-label[^>]*>Latest release</i);
  assert.match(html, /<span\b[^>]*data-release-label[^>]*>View releases<\/span>/);
  assertLink(html, releasePage, ['View releases', 'Android TV']);

  const androidInstall = extractElementById('article', 'android-install');
  assert.match(androidInstall, /APK appears after a release is published/i);
  assertLink(androidInstall, buildStatus, ['Build status']);
  assertLink(androidInstall, releasePage, ['View releases']);

  const apkHooks = elementsWithAttribute(html, 'data-apk-download');
  assert.equal(apkHooks.length, 2, 'expected hooks on both Android download links');
  assert.ok(apkHooks.every((match) => match[1].toLowerCase() === 'a'));
  assert.match(script, /\.apk\$/i);
  assert.ok(script.includes('browser_download_url'));
});

test('implements accessible menu and active-section navigation without scroll handlers', () => {
  for (const contract of [
    '[data-menu-toggle]',
    'aria-controls',
    'aria-expanded',
    "'is-open'",
    "'Escape'",
    'IntersectionObserver',
    'aria-current',
  ]) {
    assert.ok(script.includes(contract), `missing navigation contract: ${contract}`);
  }

  assert.doesNotMatch(script, /addEventListener\(\s*['"]scroll['"]/);
  assert.doesNotMatch(script, /requestAnimationFrame\s*\(/);
  assert.ok(script.includes("setAttribute('aria-current', 'location')"));
});

test('marks the document root when JavaScript is available', () => {
  assert.match(
    script,
    /document\.documentElement\.classList\.add\(\s*(['"])js\1\s*\)/,
  );
});

test('keeps mobile navigation usable without JavaScript and scopes collapse states to js', () => {
  const mobileStart = css.indexOf('@media (max-width: 760px)');
  const mobileEnd = css.indexOf('@media (max-width: 440px)', mobileStart);
  assert.notEqual(mobileStart, -1, 'missing mobile media query');
  assert.notEqual(mobileEnd, -1, 'missing end of mobile media query');
  const mobileCss = css.slice(mobileStart, mobileEnd);

  const baseHeader = extractCssRule('.site-header', mobileCss);
  assert.match(baseHeader, /position:\s*static\b/);
  assert.match(baseHeader, /height:\s*auto\b/);

  const baseHeaderInner = extractCssRule('.header-inner', mobileCss);
  assert.match(baseHeaderInner, /flex-direction:\s*column\b/);
  assert.match(baseHeaderInner, /height:\s*auto\b/);

  const baseNav = extractCssRule('.site-nav', mobileCss);
  assert.match(baseNav, /position:\s*static\b/);
  assert.match(baseNav, /flex-direction:\s*column\b/);
  assert.doesNotMatch(baseNav, /opacity:\s*0\b/);
  assert.doesNotMatch(baseNav, /pointer-events:\s*none\b/);
  assert.doesNotMatch(baseNav, /visibility:\s*hidden\b/);

  assert.match(extractCssRule('.js .menu-toggle', mobileCss), /display:\s*block\b/);

  const enhancedHeader = extractCssRule('.js .site-header', mobileCss);
  assert.match(enhancedHeader, /position:\s*sticky\b/);
  assert.match(enhancedHeader, /height:\s*var\(--header-height\)/);

  const enhancedHeaderInner = extractCssRule('.js .header-inner', mobileCss);
  assert.match(enhancedHeaderInner, /flex-direction:\s*row\b/);
  assert.match(enhancedHeaderInner, /height:\s*100%/);

  const collapsedNav = extractCssRule('.js .site-nav', mobileCss);
  assert.match(collapsedNav, /position:\s*absolute\b/);
  assert.match(collapsedNav, /opacity:\s*0\b/);
  assert.match(collapsedNav, /pointer-events:\s*none\b/);
  assert.match(collapsedNav, /visibility:\s*hidden\b/);

  const openNav = extractCssRule('.js .site-nav.is-open', mobileCss);
  assert.match(openNav, /opacity:\s*1\b/);
  assert.match(openNav, /pointer-events:\s*auto\b/);
  assert.match(openNav, /visibility:\s*visible\b/);
});

test('adds reveal enhancement states only through JavaScript', () => {
  assert.doesNotMatch(html, /\bdata-reveal(?:\s|=|>)/);
  assert.ok(script.includes("matchMedia('(prefers-reduced-motion: reduce)')"));
  assert.ok(script.includes("setAttribute('data-reveal', '')"));
  assert.ok(script.includes("classList.add('is-visible')"));
  assert.ok(script.includes('IntersectionObserver'));
});

test('implements interactive channel state and visibility-aware cycling', () => {
  assert.match(html, /<strong\b[^>]*data-now-playing-name[^>]*>Channel 01<\/strong>/);
  assert.match(html, /<span\b[^>]*data-now-playing-category[^>]*>News<\/span>/);

  for (const contract of [
    '[data-channel]',
    'aria-pressed',
    "'is-active'",
    'setInterval',
    'clearInterval',
    'visibilitychange',
    'document.hidden',
    'IntersectionObserver',
  ]) {
    assert.ok(script.includes(contract), `missing channel contract: ${contract}`);
  }
});

test('includes an accessible channel preview pause control', () => {
  assert.match(
    html,
    /<button\b(?=[^>]*data-channel-cycle-toggle)(?=[^>]*aria-pressed="false")[^>]*>\s*Pause channel preview\s*<\/button>/i,
  );
});

test('Escape closes an open menu and restores focus only when it was open', async () => {
  const page = await runLandingScript();
  page.menuToggle.dispatch('click');
  assert.equal(page.menuToggle.getAttribute('aria-expanded'), 'true');

  page.document.dispatch('keydown', { key: 'Escape' });
  assert.equal(page.menuToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(page.menuToggle.focusCount, 1);

  page.document.dispatch('keydown', { key: 'Escape' });
  assert.equal(page.menuToggle.focusCount, 1);
});

test('a non-ok release response shows pending state and build status links', async () => {
  const page = await runLandingScript({ fetchResponse: { ok: false, status: 404 } });
  assert.deepEqual(page.releaseLabels.map((label) => label.textContent), [
    'Release pending',
    'Release pending',
  ]);
  assert.ok(page.releaseLinks.every((link) => (
    link.href === 'https://github.com/thichcode/iptv-qr/actions/workflows/build-apk.yml'
  )));
});

test('a valid release updates labels and Android links to its APK', async () => {
  const page = await runLandingScript({
    fetchResponse: {
      ok: true,
      json: async () => ({
        assets: [{ browser_download_url: 'https://example.test/iptv.apk', name: 'iptv.apk' }],
        html_url: 'https://github.com/thichcode/iptv-qr/releases/tag/v2.0.0',
        tag_name: 'v2.0.0',
      }),
    },
  });
  assert.ok(page.releaseLabels.every((label) => label.textContent === 'v2.0.0'));
  assert.ok(page.releaseLinks.every((link) => link.href === 'https://example.test/iptv.apk'));
});

test('a valid release without an APK links to its release page', async () => {
  const page = await runLandingScript({
    fetchResponse: {
      ok: true,
      json: async () => ({
        assets: [],
        html_url: 'https://github.com/thichcode/iptv-qr/releases/tag/v2.0.0',
        tag_name: 'v2.0.0',
      }),
    },
  });
  assert.ok(page.releaseLinks.every((link) => (
    link.href === 'https://github.com/thichcode/iptv-qr/releases/tag/v2.0.0'
  )));
});

test('channel cycling uses one interval and manual selection pauses it', async () => {
  const page = await runLandingScript();
  const channelObserver = page.observers.find((observer) => observer.targets.includes(page.productDemo));
  assert.ok(channelObserver, 'missing product demo observer');

  channelObserver.trigger(page.productDemo, true);
  channelObserver.trigger(page.productDemo, true);
  assert.equal(page.intervalCalls, 1);
  assert.equal(page.intervals.size, 1);
  assert.equal(page.cycleToggle.hidden, false);
  assert.equal(page.cycleToggle.getAttribute('aria-pressed'), 'false');
  assert.equal(page.cycleToggle.textContent, 'Pause channel preview');

  page.channelButtons[1].dispatch('click');
  assert.equal(page.intervals.size, 0);
  assert.equal(page.cycleToggle.getAttribute('aria-pressed'), 'true');
  assert.equal(page.cycleToggle.textContent, 'Resume channel preview');
  assert.equal(page.nowPlayingName.textContent, 'Channel 02');

  page.cycleToggle.dispatch('click');
  assert.equal(page.intervalCalls, 2);
  assert.equal(page.intervals.size, 1);
  assert.equal(page.cycleToggle.getAttribute('aria-pressed'), 'false');
  assert.equal(page.cycleToggle.textContent, 'Pause channel preview');
});

test('reduced motion hides auto-cycle control and supports legacy change listeners', async () => {
  const page = await runLandingScript({ legacyMotionListener: true, reducedMotion: true });
  assert.equal(page.motionListeners.length, 1);
  assert.equal(page.cycleToggle.hidden, true);

  const channelObserver = page.observers.find((observer) => observer.targets.includes(page.productDemo));
  channelObserver.trigger(page.productDemo, true);
  assert.equal(page.intervalCalls, 0);
});
