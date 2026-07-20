(() => {
  document.documentElement.classList.add('js');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = menuToggle
    ? document.getElementById(menuToggle.getAttribute('aria-controls'))
    : null;
  const navLinks = nav ? [...nav.querySelectorAll('a')] : [];
  const internalNavLinks = navLinks.filter((link) => link.hash);

  function setMenuOpen(open) {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    internalNavLinks.forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });
  }

  const supportsObserver = 'IntersectionObserver' in window;
  const sectionLinks = internalNavLinks
    .map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter(({ section }) => section);

  if (supportsObserver && sectionLinks.length) {
    const visibility = new Map();
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibility.set(entry.target, entry.intersectionRatio));
      const active = sectionLinks.reduce((best, item) => (
        (visibility.get(item.section) || 0) > (visibility.get(best?.section) || 0) ? item : best
      ), null);

      navLinks.forEach((link) => {
        const isActive = link === active?.link;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-15% 0px -55%', threshold: [0, 0.25, 0.5, 0.75] });

    sectionLinks.forEach(({ section }) => sectionObserver.observe(section));
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealBlocks = document.querySelectorAll(
    '.section-heading, .product-demo, .setup-layout, .feature-layout, .install-grid, .faq-layout',
  );

  if (!motionQuery.matches) {
    revealBlocks.forEach((block) => block.setAttribute('data-reveal', ''));
    if (supportsObserver) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      revealBlocks.forEach((block) => revealObserver.observe(block));
    } else {
      revealBlocks.forEach((block) => block.classList.add('is-visible'));
    }
  }

  const channelButtons = [...document.querySelectorAll('[data-channel]')];
  const nowPlayingName = document.querySelector('[data-now-playing-name]');
  const nowPlayingCategory = document.querySelector('[data-now-playing-category]');
  const cycleToggle = document.querySelector('[data-channel-cycle-toggle]');

  function selectChannel(button) {
    const name = button.querySelector('strong');
    const category = button.querySelector('small');
    channelButtons.forEach((channel) => {
      const isActive = channel === button;
      channel.classList.toggle('is-active', isActive);
      channel.setAttribute('aria-pressed', String(isActive));
    });
    if (name && nowPlayingName) nowPlayingName.textContent = name.textContent;
    if (category && nowPlayingCategory) nowPlayingCategory.textContent = category.textContent;
  }

  let demoVisible = false;
  let channelTimer = null;
  let cyclePaused = false;

  function stopChannelTimer() {
    if (channelTimer === null) return;
    clearInterval(channelTimer);
    channelTimer = null;
  }

  function syncChannelTimer() {
    if (demoVisible && !cyclePaused && !motionQuery.matches && !document.hidden && channelTimer === null) {
      channelTimer = setInterval(() => {
        const activeIndex = channelButtons.findIndex((button) => button.classList.contains('is-active'));
        selectChannel(channelButtons[(activeIndex + 1) % channelButtons.length]);
      }, 5000);
    } else if (!demoVisible || cyclePaused || motionQuery.matches || document.hidden) {
      stopChannelTimer();
    }
  }

  function updateCycleControl() {
    if (!cycleToggle) return;
    cycleToggle.hidden = motionQuery.matches;
    cycleToggle.setAttribute('aria-pressed', String(cyclePaused));
    cycleToggle.textContent = cyclePaused ? 'Resume channel preview' : 'Pause channel preview';
  }

  channelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectChannel(button);
      cyclePaused = true;
      updateCycleControl();
      syncChannelTimer();
    });
  });

  if (cycleToggle) {
    cycleToggle.addEventListener('click', () => {
      cyclePaused = !cyclePaused;
      updateCycleControl();
      syncChannelTimer();
    });
    updateCycleControl();
  }

  const productDemo = document.querySelector('.product-demo');
  if (supportsObserver && productDemo && channelButtons.length) {
    const channelObserver = new IntersectionObserver(([entry]) => {
      demoVisible = entry.isIntersecting;
      syncChannelTimer();
    }, { threshold: 0.4 });
    channelObserver.observe(productDemo);
    document.addEventListener('visibilitychange', syncChannelTimer);
    const handleMotionChange = () => {
      updateCycleControl();
      syncChannelTimer();
    };
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', handleMotionChange);
    else motionQuery.addListener(handleMotionChange);
  }

  const releaseUrl = 'https://api.github.com/repos/thichcode/iptv-qr/releases/latest';
  const releasePageUrl = 'https://github.com/thichcode/iptv-qr/releases/latest';
  const buildStatusUrl = 'https://github.com/thichcode/iptv-qr/actions/workflows/build-apk.yml';

  function setReleaseLinks(label, url) {
    document.querySelectorAll('[data-release-label]').forEach((element) => {
      element.textContent = label;
    });
    document.querySelectorAll('[data-apk-download]').forEach((link) => {
      link.href = url;
    });
  }

  async function updateRelease() {
    try {
      const response = await fetch(releaseUrl, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!response.ok) {
        setReleaseLinks('Release pending', buildStatusUrl);
        return;
      }

      const release = await response.json();
      if (!release || typeof release.tag_name !== 'string' || !release.tag_name.trim()) return;

      const apk = Array.isArray(release.assets)
        ? release.assets.find((asset) => (
          typeof asset?.name === 'string'
          && /\.apk$/i.test(asset.name)
          && typeof asset.browser_download_url === 'string'
          && asset.browser_download_url
        ))
        : null;
      const releasePage = typeof release.html_url === 'string' && release.html_url
        ? release.html_url
        : releasePageUrl;
      setReleaseLinks(release.tag_name, apk ? apk.browser_download_url : releasePage);
    } catch {
      // Static release links and labels remain usable when GitHub is unavailable.
    }
  }

  updateRelease();
})();
