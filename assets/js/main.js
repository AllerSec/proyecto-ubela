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
  gsap.set('.hero__logo-wrap', { autoAlpha: 0, scale: 0.6 });
  gsap.set('.hero__canvas', { autoAlpha: 0 });
  gsap.set('.hero__cta .btn', { autoAlpha: 0, y: 24 });
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

  if (isReducedMotion()) {
    gsap.set(['.hero__canvas', '.hero__eyebrow', '.hero__title .line',
              '.hero__subtitle', '.hero__cta .btn', '.hero__logo-wrap', '.hero__scroll-hint'],
      { autoAlpha: 1, y: 0, x: 0, scale: 1, clipPath: 'none' });
    return;
  }

  const lines = qsa('.hero__title .line');
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to('.hero__canvas', { autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, 0);

  tl.fromTo('.hero__eyebrow',
    { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)' },
    { autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.5, ease: 'power3.out' },
  0.3);

  tl.to(lines, {
    autoAlpha: 1,
    y: 0,
    duration: 0.75,
    ease: 'expo.out',
    stagger: 0.2
  }, 0.6);

  tl.to('.hero__subtitle', { autoAlpha: 1, y: 0, duration: 0.6 }, 1.1);

  tl.to('.hero__cta .btn', { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12 }, 1.3);

  tl.to('.hero__logo-wrap', {
    autoAlpha: 1,
    scale: 1,
    duration: 1.1,
    ease: 'back.out(1.4)'
  }, 0.4);

  tl.to('.hero__scroll-hint', { autoAlpha: 1, duration: 0.5 }, 1.6);
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

  const mm = gsap.matchMedia();

  mm.add({
    isDesktop: '(min-width: 769px)',
    isMobile:  '(max-width: 768px)'
  }, (context) => {
    const { isDesktop } = context.conditions;

    const revealY    = isDesktop ? 40  : 20;
    const revealDur  = isDesktop ? 0.7 : 0.5;
    const revealDurB = isDesktop ? 0.4 : 0.3;

    // Set initial hidden state via JS (not CSS) so content is visible without JS
    gsap.set('.reveal',       { autoAlpha: 0, y: revealY });
    gsap.set('.reveal-left',  { autoAlpha: 0, x: -40 });
    gsap.set('.reveal-right', { autoAlpha: 0, x: 40 });

    // Animate reveal elements as they enter viewport
    ScrollTrigger.batch('.reveal', {
      onEnter: batch => gsap.to(batch, {
        autoAlpha: 1, y: 0,
        stagger: 0.1, duration: revealDur, ease: 'power3.out'
      }),
      onEnterBack: batch => gsap.to(batch, {
        autoAlpha: 1, y: 0,
        stagger: 0.05, duration: revealDurB, ease: 'power2.out'
      }),
      start: 'top 92%',
      once: false
    });

    ScrollTrigger.batch('.reveal-left', {
      onEnter: batch => gsap.to(batch, {
        autoAlpha: 1, x: 0,
        stagger: 0.1, duration: revealDur, ease: 'power3.out'
      }),
      start: 'top 92%',
      once: false
    });

    ScrollTrigger.batch('.reveal-right', {
      onEnter: batch => gsap.to(batch, {
        autoAlpha: 1, x: 0,
        stagger: 0.1, duration: revealDur, ease: 'power3.out'
      }),
      start: 'top 92%',
      once: false
    });

    // Títulos de sección: clip-path sweep (desktop) or simple fade (mobile)
    qsa('.section-header .display-2, .section-header .heading-1').forEach(title => {
      title.classList.remove('reveal');
      if (isDesktop) {
        gsap.set(title, { clipPath: 'inset(0 100% 0 0)', autoAlpha: 1 });
        ScrollTrigger.create({
          trigger: title,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(title, {
              clipPath: 'inset(0 0% 0 0)',
              duration: 0.85,
              ease: 'power4.out'
            });
          }
        });
      } else {
        gsap.set(title, { autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: title,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(title, { autoAlpha: 1, duration: 0.5, ease: 'power3.out' });
          }
        });
      }
    });

    // Cards con entrada 3D (desktop only)
    const sectorCards = qsa('.grid-3 .card');
    if (sectorCards.length) {
      if (isDesktop) {
        gsap.set(sectorCards, { autoAlpha: 0, x: -30, rotationY: -8, transformPerspective: 1200 });
        ScrollTrigger.create({
          trigger: '.grid-3',
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(sectorCards, {
              autoAlpha: 1, x: 0, rotationY: 0,
              duration: 0.8, ease: 'power3.out', stagger: 0.15
            });
          }
        });
      } else {
        gsap.set(sectorCards, { autoAlpha: 0, y: 20 });
        ScrollTrigger.create({
          trigger: '.grid-3',
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(sectorCards, {
              autoAlpha: 1, y: 0,
              duration: 0.5, ease: 'power3.out', stagger: 0.1
            });
          }
        });
      }
    }

    // About image: persiana (desktop) or simple fade (mobile)
    const aboutImg = qs('.about-image-wrap img');
    if (aboutImg) {
      const wrap = aboutImg.closest('.about-image-wrap');
      if (wrap) wrap.classList.remove('reveal-left');
      if (isDesktop) {
        gsap.set(aboutImg, { clipPath: 'inset(0 100% 0 0)' });
        ScrollTrigger.create({
          trigger: aboutImg,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(aboutImg, {
              clipPath: 'inset(0 0% 0 0)',
              duration: 1.0,
              ease: 'power3.inOut'
            });
          }
        });
      } else {
        gsap.set(aboutImg, { autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: aboutImg,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(aboutImg, { autoAlpha: 1, duration: 0.5, ease: 'power3.out' });
          }
        });
      }
    }

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
            },
            onComplete: () => {
              gsap.fromTo(el,
                { color: '#3da34d' },
                { color: el.closest('.stat')?.style.color || 'var(--clr-white)',
                  duration: 0.6, ease: 'power2.out' }
              );
            }
          });
        }
      });
    });

    // Services grid stagger
    const serviceItems = qsa('.service-item');
    if (serviceItems.length) {
      const sY = isDesktop ? 50 : 20;
      gsap.set(serviceItems, { autoAlpha: 0, y: sY, scaleY: isDesktop ? 0.92 : 1, transformOrigin: 'top center' });
      gsap.to(serviceItems, {
        autoAlpha: 1, y: 0, scaleY: 1,
        stagger: 0.08, duration: revealDur, ease: 'power3.out',
        scrollTrigger: { trigger: '.services-grid', start: 'top 85%', once: true }
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
  });
}

/* ── Mouse Parallax ───────────────────────────────────── */
function initMouseParallax() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const parallaxEls = qsa('[data-parallax]');
  if (!parallaxEls.length) return;

  // Set will-change once before attaching the listener (hints compositor)
  parallaxEls.forEach(el => {
    el.style.willChange = 'transform';
  });

  // Create one quickTo per element per axis — reuses a single tween, no GC pressure
  const movers = parallaxEls.map(el => {
    const strength = parseFloat(el.dataset.parallax) || 1;
    return {
      xTo: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power2.out' }),
      yTo: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power2.out' }),
      strength,
    };
  });

  document.addEventListener('mousemove', e => {
    const dx = (e.clientX / window.innerWidth  - 0.5) * 2; // -1 to 1
    const dy = (e.clientY / window.innerHeight - 0.5) * 2;

    movers.forEach(({ xTo, yTo, strength }) => {
      xTo(dx * 20 * strength);
      yTo(dy * 10 * strength);
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
    constructor(isSpark = false) {
      this.isSpark = isSpark;
      this.reset();
    }
    reset() {
      this.x    = Math.random() * W;
      this.y    = Math.random() * H;
      this.vx   = (Math.random() - 0.5) * (this.isSpark ? 0.5 : 0.3);
      this.vy   = -(Math.random() * (this.isSpark ? 1.0 : 0.6)) - 0.2;
      this.size = this.isSpark
        ? Math.random() * 3 + 3
        : Math.random() * 2 + 0.5;
      this.alpha  = Math.random() * 0.6 + 0.15;
      this.life   = Math.random() * 200 + 100;
      this.maxLife = this.life;
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
      if (this.isSpark) {
        ctx.fillStyle = progress > 0.4 ? '#3da34d' : '#2d7d3a';
      } else {
        ctx.fillStyle = progress > 0.5 ? '#2d7d3a' : '#6b7280';
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 60; i++) particles.push(new Particle(false));
  for (let i = 0; i < 20; i++) particles.push(new Particle(true));

  let isVisible = true;
  let rafId = null;

  const observer = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0].isIntersecting;
      if (!isVisible) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(animate);
      }
    },
    { threshold: 0 }
  );
  observer.observe(canvas);

  function animate() {
    if (!isVisible) return; // safety net
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(animate);
  }
  rafId = requestAnimationFrame(animate);
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
    ctx.strokeStyle = 'rgba(45,125,58,0.18)';
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
    ctx.strokeStyle = 'rgba(45,125,58,0.06)';
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
    ctx.strokeStyle = 'rgba(45,125,58,0.5)';
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

  let scanY = -4;
  let scanActive = false;
  let scanTimer = 0;
  const SCAN_INTERVAL = 480;

  function drawScanLine() {
    scanTimer++;
    if (scanTimer >= SCAN_INTERVAL && !scanActive) {
      scanActive = true;
      scanY = -4;
      scanTimer = 0;
    }
    if (!scanActive) return;

    scanY += H / 90;
    if (scanY > H + 4) {
      scanActive = false;
      scanY = -4;
      return;
    }

    const grad = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
    grad.addColorStop(0, 'rgba(45,125,58,0)');
    grad.addColorStop(0.5, 'rgba(45,125,58,0.12)');
    grad.addColorStop(1, 'rgba(45,125,58,0)');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 12, W, 24);
    ctx.restore();
  }

  function drawTargetRings() {
    const rings = [
      { xFn: w => w * 0.72, yFn: h => h * 0.4, r: 28 },
      { xFn: w => w * 0.25, yFn: h => h * 0.55, r: 18 },
    ];
    rings.forEach(ring => {
      const pulse = 0.5 + Math.sin(t * 0.025) * 0.3;
      ctx.save();
      ctx.globalAlpha = pulse * 0.25;
      ctx.strokeStyle = 'rgba(45,125,58,0.8)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(ring.xFn(W), ring.yFn(H), ring.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = pulse * 0.5;
      ctx.fillStyle = 'rgba(45,125,58,0.9)';
      ctx.beginPath();
      ctx.arc(ring.xFn(W), ring.yFn(H), 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = pulse * 0.2;
      ctx.strokeStyle = 'rgba(45,125,58,1)';
      ctx.lineWidth = 0.6;
      const x = ring.xFn(W), y = ring.yFn(H);
      ctx.beginPath();
      ctx.moveTo(x - ring.r * 1.4, y); ctx.lineTo(x + ring.r * 1.4, y);
      ctx.moveTo(x, y - ring.r * 1.4); ctx.lineTo(x, y + ring.r * 1.4);
      ctx.stroke();
      ctx.restore();
    });
  }

  let isVisible = true;
  let rafId = null;

  const observer = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0].isIntersecting;
      if (!isVisible) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(render);
      }
    },
    { threshold: 0 }
  );
  observer.observe(canvas);

  function render() {
    if (!isVisible) return; // safety net
    ctx.clearRect(0, 0, W, H);
    drawGridLines(1);
    drawScanLine();
    drawTargetRings();

    gears.forEach(g => {
      drawGear(g.xFn(W), g.yFn(H), g.r, g.teeth,
        t * 0.005 * g.dir, 0.12 + Math.sin(t * 0.01) * 0.04);
    });

    crosshairs.forEach(c => {
      drawCrosshair(c.xFn(W), c.yFn(H), c.size,
        0.4 + Math.sin(t * 0.02) * 0.1);
    });

    t++;
    rafId = requestAnimationFrame(render);
  }
  rafId = requestAnimationFrame(render);
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

/* ── Marquee (GSAP dual-track, hover pause) ───────────── */
function initMarquee() {
  const wrap = qs('.marquee-wrap');
  if (!wrap) return;

  const tracks = qsa('.marquee-track', wrap);
  if (!tracks.length) return;

  if (tracks.length === 1) {
    const clone = tracks[0].cloneNode(true);
    wrap.appendChild(clone);
  }

  const allTracks = qsa('.marquee-track', wrap);
  const trackW = allTracks[0].scrollWidth / 2;

  const tweens = [
    gsap.to(allTracks[0], {
      x: -trackW,
      duration: 22,
      ease: 'none',
      repeat: -1,
      modifiers: { x: gsap.utils.unitize(x => parseFloat(x) % trackW) }
    }),
    gsap.to(allTracks[1], {
      x: trackW,
      duration: 26,
      ease: 'none',
      repeat: -1,
      modifiers: { x: gsap.utils.unitize(x => parseFloat(x) % trackW) }
    })
  ];

  if (isReducedMotion()) {
    tweens.forEach(t => t.pause());
  }

  wrap.addEventListener('mouseenter', () => tweens.forEach(t => t.pause()));
  wrap.addEventListener('mouseleave', () => {
    if (!isReducedMotion()) tweens.forEach(t => t.play());
  });
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
    const path = window.location.pathname;
    // Detect base path (e.g. /proyecto-ubela/ on GitHub Pages, or / on production)
    const basePath = path.replace(/\/(eu\/)?[^/]*$/, '/');
    const target = basePath + 'en/';
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
  const overlay = qs('#page-transition');

  if (overlay) {
    gsap.fromTo(overlay,
      { clipPath: 'inset(0 0% 0 0)' },
      { clipPath: 'inset(0 100% 0 0)', duration: 0.45, ease: 'power3.inOut', delay: 0.05,
        onComplete: () => { overlay.style.pointerEvents = 'none'; }
      }
    );
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('tel:') ||
        href.startsWith('mailto:') || href.startsWith('http') ||
        link.target === '_blank') return;

    e.preventDefault();
    if (!overlay) { window.location.href = href; return; }

    overlay.style.pointerEvents = 'all';
    gsap.fromTo(overlay,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.4,
        ease: 'power3.inOut',
        onComplete: () => { window.location.href = href; }
      }
    );
  });
}

/* ── Pin Section (proceso) ────────────────────────────── */
function initPinSection() {
  if (isMobile()) return;

  const section = qs('.pin-section');
  const track = qs('.pin-section__track');
  if (!section || !track) return;

  const steps = qsa('.pin-section__step', track);
  if (!steps.length) return;

  const getScrollDist = () => track.scrollWidth - section.offsetWidth;

  const tween = gsap.to(track, {
    x: () => -getScrollDist(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => '+=' + (getScrollDist() + window.innerHeight * 0.5),
      pin: true,
      scrub: 1.2,
      invalidateOnRefresh: true,
      anticipatePin: 1
    }
  });

  steps.forEach((step, i) => {
    gsap.set(step, { autoAlpha: i === 0 ? 1 : 0.3 });
    ScrollTrigger.create({
      containerAnimation: tween,
      trigger: step,
      start: 'left 70%',
      end: 'right 30%',
      onEnter: () => gsap.to(step, { autoAlpha: 1, duration: 0.4 }),
      onLeave: () => gsap.to(step, { autoAlpha: 0.3, duration: 0.4 }),
      onLeaveBack: () => gsap.to(step, { autoAlpha: i === 0 ? 1 : 0.3, duration: 0.4 })
    });
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
  initPinSection();
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
