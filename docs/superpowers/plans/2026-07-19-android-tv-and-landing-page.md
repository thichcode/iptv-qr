# Android TV Web App + Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an Android TV web app version and a full marketing landing page for tizenbrew-iptv.

**Architecture:** Android TV reuses `inject.js` from Tizen with conditional API checks. Landing page is vanilla HTML/CSS/JS with dark mode, deployable to Vercel.

**Tech Stack:** HTML, CSS, JavaScript (vanilla), Vercel for hosting.

---

## File Structure

```
tziptv/
├── android/
│   ├── index.html              # Entry point (same as Tizen)
│   └── dist/
│       └── inject.js           # Copied from Tizen package
├── landing/
│   ├── index.html              # Landing page
│   ├── style.css               # All styles
│   └── script.js               # Interactions
├── package/                     # Extracted Tizen package (source)
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

---

### Task 1: Create Android TV directory and copy Tizen files

**Files:**
- Create: `android/index.html`
- Create: `android/dist/inject.js`

- [ ] **Step 1: Create android/index.html**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IPTV Player</title>
</head>
<body>
  <div id="status-text">Loading IPTV Player...</div>
  <script>
    window.onerror = function (message, source, line) {
      var status = document.getElementById('status-text');
      if (status) status.textContent = 'Startup error: ' + message + ' (line ' + line + ')';
    };
  </script>
  <script src="./dist/inject.js"></script>
</body>
</html>
```

- [ ] **Step 2: Copy inject.js from Tizen package**

Copy `package/dist/inject.js` → `android/dist/inject.js`. The Tizen API calls (`tizen.tvinputdevice`) are already wrapped in `try/catch` with existence checks at lines 772-778, so no changes needed.

- [ ] **Step 3: Verify Android TV app works**

Open `android/index.html` in a browser. Should show QR setup screen or channel list if playlist URL exists in localStorage.

---

### Task 2: Create landing page HTML structure

**Files:**
- Create: `landing/index.html`

- [ ] **Step 1: Create landing/index.html with all sections**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TizenBrew IPTV - IPTV Player for Smart TVs</title>
  <meta name="description" content="Free IPTV player for Samsung Tizen and Android TV. QR code setup, channel groups, remote-friendly controls.">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Hero -->
  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <h1>TizenBrew <span class="accent">IPTV</span></h1>
        <p class="tagline">Free IPTV player for your Smart TV.<br>Setup with your phone in 30 seconds.</p>
        <div class="cta-buttons">
          <a href="#download" class="btn btn-primary">Download</a>
          <a href="https://github.com/reisxd/TizenBrew" class="btn btn-secondary" target="_blank">GitHub</a>
        </div>
      </div>
      <div class="hero-mockup">
        <div class="tv-frame">
          <div class="tv-screen">
            <div class="tv-header">IPTV Player</div>
            <div class="tv-body">
              <div class="tv-player"></div>
              <div class="tv-sidebar">
                <div class="tv-channel active">1. VTV1</div>
                <div class="tv-channel">2. VTV2</div>
                <div class="tv-channel">3. HTV7</div>
              </div>
            </div>
            <div class="tv-footer">Now Playing: VTV1</div>
          </div>
          <div class="tv-stand"></div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="features" id="features">
    <div class="container">
      <h2>Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <h3>QR Code Setup</h3>
          <p>Scan QR with your phone, enter M3U URL. No typing on remote.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📺</div>
          <h3>Channel Groups</h3>
          <p>Auto-organized by group. Browse sports, news, entertainment.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎮</div>
          <h3>Remote Friendly</h3>
          <p>D-Pad navigation, Play/Pause, Channel Up/Down, number buttons.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔍</div>
          <h3>Search</h3>
          <p>Find channels instantly with built-in search.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🖥️</div>
          <h3>Fullscreen Mode</h3>
          <p>Auto-hide UI after inactivity for immersive viewing.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💾</div>
          <h3>Saved Playlists</h3>
          <p>Playlist URL saved locally. One-time setup only.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section class="how-it-works" id="how">
    <div class="container">
      <h2>How It Works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h3>Scan QR</h3>
          <p>Open your phone camera and scan the QR code on TV screen</p>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-number">2</div>
          <h3>Enter URL</h3>
          <p>Paste your M3U playlist URL on your phone</p>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-number">3</div>
          <h3>Watch</h3>
          <p>TV automatically loads your channels. Enjoy!</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Comparison -->
  <section class="comparison" id="compare">
    <div class="container">
      <h2>Why TizenBrew IPTV?</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th class="highlight">TizenBrew IPTV</th>
              <th>TiviMate</th>
              <th>OTT Navigator</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price</td>
              <td class="highlight">Free</td>
              <td>Freemium</td>
              <td>Freemium</td>
            </tr>
            <tr>
              <td>QR Setup</td>
              <td class="highlight">✓</td>
              <td>✗</td>
              <td>✗</td>
            </tr>
            <tr>
              <td>Samsung Tizen TV</td>
              <td class="highlight">✓</td>
              <td>✗</td>
              <td>✗</td>
            </tr>
            <tr>
              <td>Android TV</td>
              <td class="highlight">✓</td>
              <td>✓</td>
              <td>✓</td>
            </tr>
            <tr>
              <td>Open Source</td>
              <td class="highlight">✓</td>
              <td>✗</td>
              <td>✗</td>
            </tr>
            <tr>
              <td>Remote Controls</td>
              <td class="highlight">Full D-Pad</td>
              <td>Full</td>
              <td>Full</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section class="testimonials">
    <div class="container">
      <h2>What Users Say</h2>
      <div class="testimonial-grid">
        <div class="testimonial-card">
          <p>"Finally an IPTV player that works on my Samsung TV without paying. QR setup is genius!"</p>
          <div class="testimonial-author">- User 1</div>
        </div>
        <div class="testimonial-card">
          <p>"No more typing M3U URLs with the remote. Scan and done."</p>
          <div class="testimonial-author">- User 2</div>
        </div>
        <div class="testimonial-card">
          <p>"Works on both my Samsung and Android TV. One app for everything."</p>
          <div class="testimonial-author">- User 3</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Download -->
  <section class="download" id="download">
    <div class="container">
      <h2>Download</h2>
      <div class="download-grid">
        <div class="download-card">
          <div class="download-icon">📺</div>
          <h3>Samsung Tizen TV</h3>
          <p>Install via TizenBrew</p>
          <code>npm i tizenbrew-iptv</code>
          <a href="https://www.npmjs.com/package/tizenbrew-iptv" class="btn btn-primary" target="_blank">View on npm</a>
        </div>
        <div class="download-card">
          <div class="download-icon">🤖</div>
          <h3>Android TV</h3>
          <p>Sideload APK on your Android TV</p>
          <a href="#" class="btn btn-primary">Download APK</a>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">TizenBrew IPTV</div>
        <div class="footer-links">
          <a href="https://github.com/reisxd/TizenBrew" target="_blank">GitHub</a>
          <a href="https://www.npmjs.com/package/tizenbrew-iptv" target="_blank">npm</a>
          <a href="#">MIT License</a>
        </div>
      </div>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>
```

---

### Task 3: Create landing page styles

**Files:**
- Create: `landing/style.css`

- [ ] **Step 1: Create landing/style.css**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg: #1a1a1a;
  --bg-card: #2a2a2a;
  --accent: #ffd600;
  --text: #fff;
  --muted: #888;
  --border: #333;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

h2 {
  font-size: 36px;
  text-align: center;
  margin-bottom: 48px;
}

.accent { color: var(--accent); }

/* Hero */
.hero {
  padding: 80px 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.hero .container {
  display: flex;
  align-items: center;
  gap: 60px;
}

.hero-content { flex: 1; }

.hero-content h1 {
  font-size: 64px;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 24px;
}

.tagline {
  font-size: 20px;
  color: var(--muted);
  margin-bottom: 32px;
}

.cta-buttons {
  display: flex;
  gap: 16px;
}

.btn {
  display: inline-block;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, opacity 0.2s;
}

.btn:hover { transform: translateY(-2px); opacity: 0.9; }

.btn-primary {
  background: var(--accent);
  color: #000;
}

.btn-secondary {
  background: var(--bg-card);
  color: var(--text);
  border: 1px solid var(--border);
}

/* TV Mockup */
.hero-mockup { flex: 1; display: flex; justify-content: center; }

.tv-frame {
  background: #111;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.tv-screen {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  width: 400px;
}

.tv-header {
  padding: 12px 16px;
  background: #111;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
}

.tv-body {
  display: flex;
  height: 220px;
}

.tv-player {
  flex: 1;
  background: #111;
}

.tv-sidebar {
  width: 140px;
  background: #111;
  border-left: 1px solid var(--border);
  padding: 8px 0;
}

.tv-channel {
  padding: 8px 12px;
  font-size: 13px;
}

.tv-channel.active {
  background: #2a2a2a;
  border-left: 3px solid var(--accent);
  padding-left: 9px;
}

.tv-footer {
  padding: 10px 16px;
  background: #111;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--accent);
}

.tv-stand {
  width: 80px;
  height: 20px;
  background: #333;
  margin: 0 auto;
  border-radius: 0 0 4px 4px;
}

/* Features */
.features {
  padding: 100px 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 32px;
  border: 1px solid var(--border);
}

.feature-icon {
  font-size: 36px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 20px;
  margin-bottom: 8px;
}

.feature-card p {
  color: var(--muted);
}

/* How it works */
.how-it-works {
  padding: 100px 0;
  background: var(--bg-card);
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.step {
  text-align: center;
  flex: 1;
  max-width: 250px;
}

.step-number {
  width: 60px;
  height: 60px;
  background: var(--accent);
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  margin: 0 auto 16px;
}

.step h3 {
  font-size: 20px;
  margin-bottom: 8px;
}

.step p {
  color: var(--muted);
  font-size: 14px;
}

.step-arrow {
  font-size: 32px;
  color: var(--accent);
}

/* Comparison */
.comparison {
  padding: 100px 0;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
}

th, td {
  padding: 16px 24px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

th {
  background: #222;
  font-weight: 600;
}

.highlight {
  color: var(--accent);
}

/* Testimonials */
.testimonials {
  padding: 100px 0;
  background: var(--bg-card);
}

.testimonial-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.testimonial-card {
  background: var(--bg);
  border-radius: 12px;
  padding: 32px;
  border: 1px solid var(--border);
}

.testimonial-card p {
  font-size: 16px;
  margin-bottom: 16px;
  font-style: italic;
}

.testimonial-author {
  color: var(--accent);
  font-weight: 600;
}

/* Download */
.download {
  padding: 100px 0;
}

.download-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
}

.download-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  border: 1px solid var(--border);
}

.download-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.download-card h3 {
  font-size: 24px;
  margin-bottom: 8px;
}

.download-card p {
  color: var(--muted);
  margin-bottom: 16px;
}

.download-card code {
  display: block;
  background: #111;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
}

/* Footer */
.footer {
  padding: 40px 0;
  border-top: 1px solid var(--border);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-brand {
  font-size: 18px;
  font-weight: 600;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-links a {
  color: var(--muted);
  text-decoration: none;
}

.footer-links a:hover {
  color: var(--accent);
}

/* Responsive */
@media (max-width: 768px) {
  .hero .container { flex-direction: column; text-align: center; }
  .hero-content h1 { font-size: 40px; }
  .cta-buttons { justify-content: center; }
  .feature-grid { grid-template-columns: 1fr; }
  .steps { flex-direction: column; }
  .step-arrow { transform: rotate(90deg); }
  .testimonial-grid { grid-template-columns: 1fr; }
  .download-grid { grid-template-columns: 1fr; }
  .footer-content { flex-direction: column; gap: 16px; }
}
```

---

### Task 4: Create landing page script

**Files:**
- Create: `landing/script.js`

- [ ] **Step 1: Create landing/script.js**

```javascript
document.addEventListener('DOMContentLoaded', function() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Animate on scroll
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .step, .testimonial-card, .download-card').forEach(function(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s, transform 0.6s';
    observer.observe(el);
  });
});
```

---

### Task 5: Clean up extracted package

**Files:**
- Delete: `package/` directory (extracted tarball)

- [ ] **Step 1: Remove extracted package directory**

```bash
rm -rf package tizenbrew-iptv-0.1.9.tgz
```

---

### Task 6: Verify everything works

- [ ] **Step 1: Open landing page in browser**

Open `landing/index.html` in browser. Verify all sections render correctly.

- [ ] **Step 2: Open Android TV app in browser**

Open `android/index.html` in browser. Verify QR setup screen appears.

---

### Task 7: Initialize git and commit

- [ ] **Step 1: Initialize git repository**

```bash
git init
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
package/
*.tgz
```

- [ ] **Step 3: Commit all files**

```bash
git add -A
git commit -m "feat: add Android TV web app and landing page"
```
