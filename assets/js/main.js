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

  gsap.set(lines, { autoAlpha: 0, yPercent: 100, force3D: true });
  gsap.set(introSelector, { autoAlpha: 0, y: 24, force3D: true });
  gsap.set('.hero__logo-wrap', { autoAlpha: 0, scale: 0.85, force3D: true });
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

  const lineInners = qsa('.page-title-line-inner');
  if (lineInners.length) {
    gsap.set(lineInners, { autoAlpha: 0, yPercent: 100, force3D: true });
  }

  const subtitles = qsa('.page-hero .body-lg');
  subtitles.forEach(subtitle => subtitle.classList.remove('reveal'));
  if (subtitles.length) {
    gsap.set(subtitles, { autoAlpha: 0, y: 24, force3D: true });
  }
}

function initHeroAnimation() {
  const hero = qs('.hero');
  if (!hero || hero.dataset.heroAnimated === 'true') return;

  hero.dataset.heroAnimated = 'true';

  const lines = qsa('.hero__title .line');
  const highlights = qsa('.hero__title .keyword-highlight');

  const tl = gsap.timeline({
    onComplete: () => {
      // Trigger highlighter sweep slightly after the title fully settles
      setTimeout(() => {
        highlights.forEach(el => el.classList.add('active'));
      }, 200);
    }
  });

  tl.to('.hero__eyebrow', {
    autoAlpha: 1,
    y: 0,
    duration: 0.6,
    ease: 'power3.out'
  });

  tl.to(lines, {
    autoAlpha: 1,
    yPercent: 0,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.1,
    force3D: true
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
      yPercent: 0,
      duration: 0.8,
      ease: 'power4.out',
      stagger: 0.12,
      force3D: true
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
  // Counters — number stats animate when first scrolled into view
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
    const path = window.location.pathname;
    // Detect base path (e.g. /proyecto-ubela/ on GitHub Pages, or / on production)
    const basePath = path.replace(/\/(eu\/)?[^/]*$/, '/');
    const target = basePath + 'en/';
    window.location.replace(target);
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
  initScrollAnimations();
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

  initSVGAnimations();
  initPageTransitions();
});

// Refresh ScrollTrigger after fonts load
document.fonts?.ready.then(() => {
  ScrollTrigger.refresh();
});
