/**
 * UBELA S.L. — Main JavaScript
 * GSAP-powered animations, cursor, loader, navigation
 */

/* ── Register GSAP Plugins ────────────────────────────── */
gsap.registerPlugin(ScrollTrigger);

/* ── Utility ──────────────────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const isMobile = () => window.innerWidth <= 768;
const isReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Session loader (only first visit) ───────────────── */
function initLoader() {
  const loader = qs('#page-loader');
  if (!loader) return;

  const VISITED_KEY = 'ubela_visited';

  function dismissLoader() {
    loader.style.transition = 'opacity 0.5s ease';
    loader.style.opacity    = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      document.body.style.overflow = '';
      revealPage();
    }, 520);
  }

  if (sessionStorage.getItem(VISITED_KEY)) {
    loader.style.display = 'none';
    document.body.style.overflow = '';
    revealPage();
    return;
  }

  sessionStorage.setItem(VISITED_KEY, '1');
  document.body.style.overflow = 'hidden';

  const bar     = qs('.loader__bar', loader);
  const percent = qs('.loader__percent', loader);

  // Animate progress bar with CSS transition, no GSAP dependency
  let progress = 0;
  if (bar) {
    bar.style.transition = 'none';
    bar.style.width = '0%';
  }

  const duration = 1400; // ms
  const start    = performance.now();

  function tick(now) {
    const elapsed = now - start;
    progress = Math.min(elapsed / duration, 1);
    const pct = Math.round(progress * 100);

    if (bar)     bar.style.width   = pct + '%';
    if (percent) percent.textContent = pct + '%';

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Small pause then dismiss
      setTimeout(dismissLoader, 200);
    }
  }

  // Safety timeout — never get stuck longer than 4s
  const safetyTimeout = setTimeout(dismissLoader, 4000);

  requestAnimationFrame(ts => {
    // Clear safety if animation completes naturally
    const origDismiss = dismissLoader;
    requestAnimationFrame(tick);
    // Override to also clear safety timeout
    setTimeout(() => clearTimeout(safetyTimeout), duration + 800);
  });
}

function preloadPageAssets() {
  // Trigger all inner-page link fetches to warm the browser cache
  qsa('link[rel="prefetch"]').forEach(l => {
    try { new URL(l.href); } catch {}
  });
}

/* ── Page reveal (runs after loader or immediately) ───── */
function revealPage() {
  if (isReducedMotion()) {
    qsa('.reveal, .reveal-left, .reveal-right').forEach(el => {
      gsap.set(el, { opacity: 1, x: 0, y: 0 });
    });
    scheduleHeroAnimation();
    schedulePageTitleAnimation();
    initScrollAnimations();
    return;
  }

  scheduleHeroAnimation();
  schedulePageTitleAnimation();
  initScrollAnimations();
}

/* ── Custom Cursor (disabled — native cursor) ─────────── */
function initCursor() {
  // Using native browser cursor
}

/* ── Navigation ───────────────────────────────────────── */
function initNav() {
  const nav = qs('.nav');
  if (!nav) return;

  // Scroll effect
  ScrollTrigger.create({
    start: 'top -80',
    onEnter:      () => nav.classList.add('nav--scrolled'),
    onLeaveBack:  () => nav.classList.remove('nav--scrolled'),
  });

  // Active link highlighting
  const links = qsa('.nav__link[data-page]');
  const currentPath = window.location.pathname.split('/').filter(Boolean).pop() || 'index.html';

  links.forEach(link => {
    if (link.dataset.page === currentPath ||
        (currentPath === '' && link.dataset.page === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Mobile hamburger
  const hamburger = qs('.nav__hamburger');
  const overlay   = qs('.nav__overlay');

  if (hamburger && overlay) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      overlay.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    qsa('.nav__overlay .nav__link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ── Hero animation ───────────────────────────────────── */
function prepareHeroAnimation() {
  const hero = qs('.hero');
  if (!hero) return;

  const lines = qsa('.hero__title .line');
  const introSelector = '.hero__eyebrow, .hero__subtitle, .hero__cta, .hero__scroll-hint';

  gsap.set(lines, { autoAlpha: 0, y: '100%' });
  gsap.set(introSelector, { autoAlpha: 0, y: 24 });
  gsap.set('.hero__logo-wrap', { autoAlpha: 0, scale: 0.85 });
}

function splitPageTitleLines(title) {
  if (title.dataset.titleSplit === 'true') return;

  const lines = title.innerHTML
    .split(/<br\s*\/?>/i)
    .map(line => line.trim())
    .filter(Boolean);

  if (!lines.length) return;

  title.innerHTML = lines
    .map(line => `<span class="page-title-line"><span class="page-title-line-inner">${line}</span></span>`)
    .join('');
  title.dataset.titleSplit = 'true';
}

function preparePageTitleAnimation() {
  const titles = qsa('.page-hero h1.display-2');

  titles.forEach(title => {
    title.classList.remove('reveal');
    splitPageTitleLines(title);
  });

  gsap.set('.page-title-line-inner', { autoAlpha: 0, y: '100%' });

  qsa('.page-hero .body-lg').forEach(subtitle => {
    subtitle.classList.remove('reveal');
  });
  gsap.set('.page-hero .body-lg', { autoAlpha: 0, y: 24 });
}

function initHeroAnimation() {
  const hero = qs('.hero');
  if (!hero || hero.dataset.heroAnimated === 'true') return;

  hero.dataset.heroAnimated = 'true';

  const lines = qsa('.hero__title .line');

  const tl = gsap.timeline();

  tl.to('.hero__eyebrow', {
    autoAlpha: 1,
    y: 0,
    duration: 0.6,
    ease: 'power3.out'
  });

  tl.to(lines, {
    autoAlpha: 1,
    y: 0,
    duration: 0.8,
    ease: 'power4.out',
    stagger: 0.12
  }, '-=0.25');

  tl.to('.hero__subtitle', {
    autoAlpha: 1,
    y: 0,
    duration: 0.6,
    ease: 'power3.out'
  }, '-=0.3');

  tl.to('.hero__cta', {
    autoAlpha: 1,
    y: 0,
    duration: 0.5,
    ease: 'power3.out'
  }, '-=0.3');

  tl.to('.hero__logo-wrap', {
    autoAlpha: 1,
    scale: 1,
    duration: 0.9,
    ease: 'power3.out'
  }, '-=0.6');

  tl.to('.hero__scroll-hint', {
    autoAlpha: 1,
    duration: 0.5
  }, '-=0.2');
}

let heroAnimationTimer;
function scheduleHeroAnimation() {
  window.clearTimeout(heroAnimationTimer);
  heroAnimationTimer = window.setTimeout(initHeroAnimation, 480);
}

let pageTitleAnimationTimer;
function initPageTitleAnimation() {
  const pageHeroes = qsa('.page-hero');
  if (!pageHeroes.length) return;

  pageHeroes.forEach(pageHero => {
    if (pageHero.dataset.titleAnimated === 'true') return;
    pageHero.dataset.titleAnimated = 'true';

    const tl = gsap.timeline();
    tl.to(qsa('.page-title-line-inner', pageHero), {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      ease: 'power4.out',
      stagger: 0.12
    });

    tl.to(qsa('.body-lg', pageHero), {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out'
    }, '+=0.01');
  });
}

function schedulePageTitleAnimation() {
  window.clearTimeout(pageTitleAnimationTimer);
  pageTitleAnimationTimer = window.setTimeout(initPageTitleAnimation, 480);
}

/* ── Scroll reveal animations ─────────────────────────── */
function initScrollAnimations() {
  if (isReducedMotion()) {
    // Just make everything visible immediately
    qsa('.reveal, .reveal-left, .reveal-right').forEach(el => {
      gsap.set(el, { opacity: 1, x: 0, y: 0, visibility: 'visible' });
    });
    return;
  }

  // Set initial hidden state via JS (not CSS) so content is visible without JS
  gsap.set('.reveal',       { autoAlpha: 0, y: 40 });
  gsap.set('.reveal-left',  { autoAlpha: 0, x: -40 });
  gsap.set('.reveal-right', { autoAlpha: 0, x: 40 });

  // Animate reveal elements as they enter viewport
  ScrollTrigger.batch('.reveal', {
    onEnter: batch => gsap.to(batch, {
      autoAlpha: 1, y: 0,
      stagger: 0.1, duration: 0.7, ease: 'power3.out'
    }),
    onEnterBack: batch => gsap.to(batch, {
      autoAlpha: 1, y: 0,
      stagger: 0.05, duration: 0.4, ease: 'power2.out'
    }),
    start: 'top 92%',
    once: false
  });

  ScrollTrigger.batch('.reveal-left', {
    onEnter: batch => gsap.to(batch, {
      autoAlpha: 1, x: 0,
      stagger: 0.1, duration: 0.7, ease: 'power3.out'
    }),
    start: 'top 92%',
    once: false
  });

  ScrollTrigger.batch('.reveal-right', {
    onEnter: batch => gsap.to(batch, {
      autoAlpha: 1, x: 0,
      stagger: 0.1, duration: 0.7, ease: 'power3.out'
    }),
    start: 'top 92%',
    once: false
  });

  // Counters
  qsa('.stat__number[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: function () {
            el.textContent = Math.round(this.targets()[0].val)
              + (el.dataset.suffix || '');
          }
        });
      }
    });
  });

  // Services grid stagger
  const serviceItems = qsa('.service-item');
  if (serviceItems.length) {
    gsap.set(serviceItems, { autoAlpha: 0, y: 50 });
    gsap.to(serviceItems, {
      autoAlpha: 1, y: 0,
      stagger: 0.08, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: '.services-grid', start: 'top 85%' }
    });
  }

  // Parallax sections
  qsa('[data-parallax-section]').forEach(el => {
    gsap.to(el, {
      y: () => el.dataset.parallaxSection || -60,
      ease: 'none',
      scrollTrigger: {
        trigger: el, start: 'top bottom', end: 'bottom top', scrub: true
      }
    });
  });
}

/* ── Mouse Parallax ───────────────────────────────────── */
function initMouseParallax() {
  if (isMobile()) return;

  const parallaxEls = qsa('[data-parallax]');
  if (!parallaxEls.length) return;

  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    parallaxEls.forEach(el => {
      const strength = parseFloat(el.dataset.parallax) || 1;
      gsap.to(el, {
        x: dx * 20 * strength,
        y: dy * 10 * strength,
        duration: 1,
        ease: 'power1.out'
      });
    });
  });
}

/* ── Industrial Particle Canvas ───────────────────────── */
function initParticleCanvas() {
  const canvas = qs('#particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -Math.random() * 0.6 - 0.2;
      this.size   = Math.random() * 2 + 0.5;
      this.alpha  = Math.random() * 0.5 + 0.1;
      this.life   = Math.random() * 200 + 100;
      this.maxLife= this.life;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
      if (this.life <= 0 || this.y < -10) this.reset();
    }
    draw() {
      const progress = this.life / this.maxLife;
      ctx.globalAlpha = this.alpha * progress;
      ctx.fillStyle = progress > 0.5 ? '#e8411e' : '#6b7280';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  animate();
}

/* ── Hero Animated SVG Background (industrial gears/lines) */
function initHeroSVGBackground() {
  const canvas = qs('#hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, t = 0;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawGear(x, y, r, teeth, rot, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#e8411e';
    ctx.lineWidth = 1;
    ctx.translate(x, y);
    ctx.rotate(rot);

    const toothLen = r * 0.3;
    const toothW   = (2 * Math.PI) / (teeth * 2);

    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i / (teeth * 2)) * Math.PI * 2;
      const rad   = i % 2 === 0 ? r : r + toothLen;
      const px    = Math.cos(angle) * rad;
      const py    = Math.sin(angle) * rad;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawGridLines(alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;

    const spacing = 60;
    for (let x = 0; x < W; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCrosshair(x, y, size, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(232,65,30,0.5)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const gears = [
    { xFn: w => w * 0.85, yFn: h => h * 0.15, r: 80,  teeth: 12, dir:  1 },
    { xFn: w => w * 0.82, yFn: h => h * 0.15, r: 48,  teeth: 8,  dir: -1 },
    { xFn: w => w * 0.1,  yFn: h => h * 0.85, r: 60,  teeth: 10, dir:  1 },
    { xFn: w => w * 0.15, yFn: h => h * 0.12, r: 36,  teeth: 7,  dir: -1 },
  ];

  const crosshairs = [
    { xFn: w => w * 0.3, yFn: h => h * 0.3,  size: 24 },
    { xFn: w => w * 0.7, yFn: h => h * 0.6,  size: 16 },
    { xFn: w => w * 0.55, yFn: h => h * 0.2, size: 20 },
  ];

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawGridLines(1);

    gears.forEach(g => {
      drawGear(g.xFn(W), g.yFn(H), g.r, g.teeth,
        t * 0.005 * g.dir, 0.12 + Math.sin(t * 0.01) * 0.04);
    });

    crosshairs.forEach(c => {
      drawCrosshair(c.xFn(W), c.yFn(H), c.size,
        0.4 + Math.sin(t * 0.02) * 0.1);
    });

    t++;
    requestAnimationFrame(render);
  }
  render();
}

/* ── Carousel ─────────────────────────────────────────── */
function initCarousels() {
  qsa('.carousel').forEach(carousel => {
    const track  = qs('.carousel__track', carousel);
    const slides = qsa('.carousel__slide', carousel);
    const dots   = qsa('.carousel__dot', carousel);
    const prevBtn = qs('.carousel__btn--prev', carousel);
    const nextBtn = qs('.carousel__btn--next', carousel);

    if (!track || slides.length === 0) return;

    let current = 0;

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      gsap.to(track, {
        x: -current * 100 + '%',
        duration: 0.6,
        ease: 'power3.out'
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    // Auto-advance
    let timer = setInterval(() => goTo(current + 1), 5000);
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', () => {
      timer = setInterval(() => goTo(current + 1), 5000);
    });

    goTo(0);
  });
}

/* ── SVG Animations (GSAP-controlled) ────────────────── */
function animateSVG(el, vars) {
  gsap.to(el, { ...vars, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

function initSVGAnimations() {
  if (isReducedMotion()) return;

  // Float: card icons, service icons, stat icons
  qsa('.card__icon svg, .service-item__icon svg, .stat svg').forEach((svg, i) => {
    animateSVG(svg, {
      y: -4, rotation: 2,
      duration: 2.4 + (i % 3) * 0.4,
      delay: -(i % 3) * 0.8,
    });
  });

  // Breathe: all other main/footer SVGs not already handled
  qsa('main svg, footer svg').forEach(svg => {
    const handled =
      svg.closest('.card__icon') ||
      svg.closest('.service-item__icon') ||
      svg.closest('.stat') ||
      svg.closest('.contact-info-icon') ||
      svg.closest('.footer__contact-icon') ||
      svg.closest('.btn') ||
      svg.closest('.carousel__btn');
    if (handled) return;
    animateSVG(svg, { scale: 1.04, opacity: 1, duration: 2.7 });
  });

  // Pulse: contact icons
  qsa('.contact-info-icon, .footer__contact-icon').forEach((el, i) => {
    animateSVG(el, { scale: 1.08, opacity: 1, duration: 1.8, delay: -i * 0.3 });
  });

  // Nudge: button arrows
  qsa('.btn svg, .carousel__btn svg').forEach((svg, i) => {
    animateSVG(svg, { x: 3, duration: 1.2, delay: -i * 0.2 });
  });
}

/* ── Marquee duplicate ────────────────────────────────── */
function initMarquee() {
  const track = qs('.marquee-track');
  if (!track) return;

  // Duplicate for seamless loop
  const clone = track.cloneNode(true);
  track.parentElement.appendChild(clone);
}

/* ── Language auto-detect ─────────────────────────────── */
function initLanguageDetect() {
  const KEY = 'ubela_lang_set';
  if (sessionStorage.getItem(KEY)) return;

  sessionStorage.setItem(KEY, '1');

  const currentLang = document.documentElement.lang || 'es';

  // Use browser language as proxy (no user permission needed)
  const browserLang = navigator.language || navigator.userLanguage || 'es';
  const lang2 = browserLang.slice(0, 2).toLowerCase();

  // Basque is never the default (per requirements)
  const langMap = {
    'en': '/en/',
    'fr': '/en/',
    'de': '/en/',
    'pt': '/',
    'it': '/',
    'es': '/',
  };

  // Only redirect if we're on root and browser is English
  if (lang2 === 'en' && currentLang !== 'en' && !window.location.pathname.includes('/en/')) {
    const target = window.location.pathname.replace(/^\/(eu\/)?/, '/en/');
    window.location.replace(target);
  }
}

/* ── Microinteractions ────────────────────────────────── */
function initMicrointeractions() {
  // Button hover ripple
  qsa('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute; border-radius:50%;
        pointer-events:none; background:rgba(255,255,255,0.1);
        width:4px; height:4px;
        left:${x}px; top:${y}px;
        transform:translate(-50%,-50%) scale(1);
      `;
      btn.style.position = 'relative';
      btn.appendChild(ripple);
      gsap.to(ripple, {
        scale: 80,
        autoAlpha: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => ripple.remove()
      });
    });
  });

  // Card magnetic effect
  if (!isMobile()) {
    qsa('.card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width  / 2) / rect.width  * 6;
        const y = (e.clientY - rect.top  - rect.height / 2) / rect.height * 4;
        gsap.to(card, { rotationX: -y, rotationY: x, duration: 0.3, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power3.out' });
      });

      // Speed up icon SVG animation on hover
      const iconSVG = card.querySelector('.card__icon svg');
      if (iconSVG) {
        card.addEventListener('mouseenter', () => {
          gsap.getTweensOf(iconSVG).forEach(t => t.timeScale(2));
        });
        card.addEventListener('mouseleave', () => {
          gsap.getTweensOf(iconSVG).forEach(t => t.timeScale(1));
        });
      }
    });
  }
}

/* ── Nav link smooth prefetch ─────────────────────────── */
function initPrefetch() {
  qsa('.nav__link[href], .footer__links a[href]').forEach(link => {
    link.addEventListener('mouseenter', () => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
        const prefetchLink = document.createElement('link');
        prefetchLink.rel  = 'prefetch';
        prefetchLink.href = href;
        document.head.appendChild(prefetchLink);
      }
    }, { once: true });
  });
}

/* ── Page transition on link clicks ──────────────────── */
function initPageTransitions() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('tel:') ||
        href.startsWith('mailto:') || href.startsWith('http') ||
        link.target === '_blank') return;

    e.preventDefault();

    gsap.to('body', {
      autoAlpha: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        window.location.href = href;
      }
    });
  });

  // Fade in on load (for transitions)
  gsap.from('body', {
    autoAlpha: 0,
    duration: 0.4,
    ease: 'power2.out',
    clearProps: 'opacity,visibility'
  });
}

/* ── Init ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  prepareHeroAnimation();
  preparePageTitleAnimation();
  initCursor();
  initNav();
  initMarquee();
  initCarousels();
  initMouseParallax();
  initMicrointeractions();
  initPrefetch();
  initLanguageDetect();

  const hasLoader = !!document.querySelector('#page-loader');

  if (hasLoader) {
    // Loader handles revealPage + page transitions after it finishes
    initLoader();
  } else {
    // Subpages: no loader — reveal immediately and enable transitions
    revealPage();
  }

  // Always init canvas effects, SVG animations, and transitions
  initParticleCanvas();
  initHeroSVGBackground();
  initSVGAnimations();
  initPageTransitions();
});

// Refresh ScrollTrigger after fonts load
document.fonts?.ready.then(() => {
  ScrollTrigger.refresh();
});
