// ============================================================
// 100SVH FALLBACK — iOS Safari viewport height fix
// Sets --hero-height from window.innerHeight only when the
// svh unit is unsupported (older iOS Safari < 16).
// Does NOT update on scroll — only on resize — to prevent jump.
// ============================================================
(function setVhFallback() {
  const testEl = document.createElement('div');
  testEl.style.height = '1svh';
  document.body.appendChild(testEl);
  const svhSupported = testEl.offsetHeight > 0;
  document.body.removeChild(testEl);

  if (!svhSupported) {
    const setHeight = () => {
      document.documentElement.style.setProperty('--hero-height', `${window.innerHeight}px`);
    };
    setHeight();
    window.addEventListener('resize', setHeight, { passive: true });
  }
})();

// ============================================================
// JS PARALLAX — hero background at 40% scroll speed
// requestAnimationFrame keeps it smooth and GPU-composited.
// ============================================================
const heroBg = document.querySelector('.hero-bg');
let rafTicking = false;

function updateParallax() {
  if (heroBg) {
    heroBg.style.transform = `translateY(-${window.scrollY * 0.4}px)`;
  }
  rafTicking = false;
}

window.addEventListener('scroll', () => {
  if (!rafTicking) {
    requestAnimationFrame(updateParallax);
    rafTicking = true;
  }
}, { passive: true });

// ============================================================
// NAV — Smooth scroll, history cleanup, mobile close
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const href   = this.getAttribute('href');
    const target = document.querySelector(href);
    if (!target) return;
    history.replaceState(null, null, href);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('nav-menu')?.classList.remove('active');
  });
});

// ============================================================
// HAMBURGER MENU
// ============================================================
const hamburger = document.querySelector('.hamburger');
const navMenu   = document.getElementById('nav-menu');
if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));
  document.querySelectorAll('#nav-menu a').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('active'));
  });
}

// ============================================================
// ACTIVE NAV INDICATOR — IntersectionObserver
// ============================================================
const navLinks = document.querySelectorAll('#nav-menu a');
const sections = document.querySelectorAll('section[id]');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('nav-active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, {
  root: null,
  rootMargin: '-40% 0px -40% 0px',
  threshold: 0,
});
sections.forEach(s => navObserver.observe(s));

// ============================================================
// SWIPER — Featured works
// ============================================================
const swiper = new Swiper('.featured-swiper', {
  slidesPerView: 1.2,
  spaceBetween: 10,
  loop: true,
  grabCursor: true,
  centeredSlides: true,
  pagination: { el: '.swiper-pagination', clickable: true, dynamicBullets: true },
  navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
  autoplay: { delay: 3000, disableOnInteraction: false },
  breakpoints: {
    768:  { slidesPerView: 2, spaceBetween: 10 },
    1024: { slidesPerView: 3, spaceBetween: 15 },
  },
});

let pauseTimer;
function pauseAutoplay() {
  swiper.autoplay.stop();
  clearTimeout(pauseTimer);
  pauseTimer = setTimeout(() => swiper.autoplay.start(), 15000);
}
swiper.on('touchStart', pauseAutoplay);
const swiperNextBtn = document.querySelector('.swiper-button-next');
const swiperPrevBtn = document.querySelector('.swiper-button-prev');
if (swiperNextBtn) swiperNextBtn.addEventListener('click', pauseAutoplay);
if (swiperPrevBtn) swiperPrevBtn.addEventListener('click', pauseAutoplay);

// ============================================================
// BACK-TO-TOP
// ============================================================
const backToTopBtn = document.querySelector('.back-to-top');

window.addEventListener('scroll', () => {
  if (backToTopBtn) backToTopBtn.classList.toggle('show', window.scrollY > 300);
}, { passive: true });

if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================================
// GALLERY TABS
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active'); b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById(btn.dataset.tab)?.classList.add('active');
  });
});

// ============================================================
// PHOTO LIGHTBOX
// ============================================================
const lightbox      = document.getElementById('lightbox');
const lightboxInner = document.querySelector('.lightbox-inner');
const lightboxImg   = document.querySelector('.lightbox-img');
const closeBtn      = document.querySelector('.lightbox-close');
const prevBtn       = document.querySelector('.lightbox-prev');
const nextBtn       = document.querySelector('.lightbox-next');
const galleryItems  = Array.from(document.querySelectorAll('.gallery-item'));

let currentIndex   = 0;
let lightboxActive = false;
let scale          = 1;
let currentX = 0, currentY = 0;
let isDragging = false, startX = 0, startY = 0;

function showLightbox(index, pushState = true) {
  const urlMatch = galleryItems[index].style.backgroundImage.match(/url\(["']?(.+?)["']?\)/i);
  if (!urlMatch) return;
  lightboxImg.src = urlMatch[1];
  scale = 1; currentX = 0; currentY = 0;
  lightboxImg.classList.remove('zoomed');
  lightboxImg.style.transform = 'scale(1)';
  lightbox.classList.add('show');
  currentIndex   = index;
  lightboxActive = true;
  if (pushState) history.pushState({ lightbox: true }, '', '#lightbox');
}

function closeLightbox(popState = false) {
  lightbox.classList.remove('show');
  lightboxActive = false;
  currentX = 0; currentY = 0; scale = 1;
  if (!popState && history.state?.lightbox) history.back();
}

function updateTransform() {
  lightboxImg.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
}

function clampPan() {
  if (scale <= 1) { currentX = 0; currentY = 0; return; }
  const ir  = lightboxImg.getBoundingClientRect();
  const cr  = lightboxInner.getBoundingClientRect();
  const mxX = Math.max(0, (ir.width  - cr.width)  / 2);
  const mxY = Math.max(0, (ir.height - cr.height) / 2);
  currentX  = Math.min(mxX, Math.max(-mxX, currentX));
  currentY  = Math.min(mxY, Math.max(-mxY, currentY));
}

galleryItems.forEach((item, i) => item.addEventListener('click', () => showLightbox(i)));
closeBtn.addEventListener('click', () => closeLightbox());
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
nextBtn.addEventListener('click', () => { currentIndex = (currentIndex + 1) % galleryItems.length; showLightbox(currentIndex, false); });
prevBtn.addEventListener('click', () => { currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length; showLightbox(currentIndex, false); });

document.addEventListener('keydown', e => {
  if (!lightboxActive) return;
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft')  prevBtn.click();
  if (e.key === 'Escape')     closeLightbox();
});

let touchStartX = 0, touchStartY = 0, touchStartTime = 0, isPotentialSwipe = true;

lightbox.addEventListener('touchstart', (e) => {
  if (!lightboxActive) return;
  const t = e.touches[0];
  touchStartX = t.clientX; touchStartY = t.clientY; touchStartTime = Date.now();
  isPotentialSwipe = !(scale > 1 || e.touches.length > 1);
  if (scale > 1 && e.touches.length === 1) {
    isDragging = true; startX = t.clientX - currentX; startY = t.clientY - currentY;
  }
});
lightbox.addEventListener('touchmove', (e) => {
  if (!lightboxActive) return;
  if (e.touches.length > 1) { isPotentialSwipe = false; return; }
  if (scale > 1) isPotentialSwipe = false;
  const t  = e.touches[0];
  if (Math.abs(t.clientY - touchStartY) > Math.abs(t.clientX - touchStartX) + 20) isPotentialSwipe = false;
});
lightbox.addEventListener('touchend', (e) => {
  if (!lightboxActive || !isPotentialSwipe) { isDragging = false; return; }
  const t  = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  if (Date.now() - touchStartTime < 500 && Math.abs(dx) > 50) {
    dx > 0 ? prevBtn.click() : nextBtn.click();
  }
  isDragging = false;
});

window.addEventListener('popstate', e => {
  if (lightboxActive && !e.state?.lightbox) closeLightbox(true);
});

lightboxImg.addEventListener('click', e => {
  e.stopPropagation();
  scale = scale === 1 ? 2 : 1;
  lightboxImg.classList.toggle('zoomed', scale === 2);
  currentX = 0; currentY = 0;
  updateTransform();
});

lightboxInner.addEventListener('mousemove', e => {
  if (scale <= 1) return;
  const r  = lightboxInner.getBoundingClientRect();
  currentX = -((e.clientX - r.left)  / r.width  - 0.5) * 2 * (scale - 1) * r.width  / 2;
  currentY = -((e.clientY - r.top)   / r.height - 0.5) * 2 * (scale - 1) * r.height / 2;
  clampPan();
  updateTransform();
});

// ============================================================
// CERTIFICATE — crossfade bio image slot
// Clicking training row swaps portrait ↔ certificate.
// Mobile: auto-scrolls image into view after click.
// ============================================================
const certTrigger  = document.querySelector('.cert-trigger');
const bioImageWrap = document.querySelector('.bio-image-wrap');

if (certTrigger && bioImageWrap) {
  function toggleCert() {
    const isOpen = certTrigger.getAttribute('aria-expanded') === 'true';
    const nowOpen = !isOpen;
    certTrigger.setAttribute('aria-expanded', String(nowOpen));
    bioImageWrap.classList.toggle('cert-active', nowOpen);

    // Mobile: scroll image wrap into view so user sees the swap
    if (nowOpen && window.innerWidth <= 768) {
      setTimeout(() => {
        bioImageWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }

  certTrigger.addEventListener('click', toggleCert);
  certTrigger.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCert(); }
  });
}

// ============================================================
// LANGUAGE VIDEO MODAL — YouTube IFrame Player API
// Portrait 9:16. Auto-close on state 0 (ended).
// Close button works at DOM level regardless of player state.
// ============================================================
(function () {
  const tag = document.createElement('script');
  tag.src   = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
})();

let langPlayer      = null;
let langPlayerReady = false;

window.onYouTubeIframeAPIReady = () => { langPlayerReady = true; };

const langModal      = document.getElementById('lang-modal');
const langModalTitle = document.getElementById('lang-modal-title');
const langModalClose = document.querySelector('.lang-modal-close');

function openLangVideo(videoId, langName) {
  langModalTitle.textContent = `${langName}`;
  langModal.classList.add('show');
  document.body.style.overflow = 'hidden';

  if (langPlayer) { try { langPlayer.destroy(); } catch (e) {} langPlayer = null; }

  const container = document.getElementById('lang-player-container');
  container.innerHTML = '<div id="lang-youtube-player"></div>';

  function createPlayer() {
    langPlayer = new YT.Player('lang-youtube-player', {
      videoId,
      width: '100%', height: '100%',
      playerVars: { autoplay: 1, controls: 1, rel: 0, playsinline: 1, modestbranding: 1 },
      events: {
        onStateChange(event) {
          if (event.data === YT.PlayerState.ENDED) closeLangModal();
        },
      },
    });
  }

  if (langPlayerReady && typeof YT !== 'undefined' && YT.Player) {
    createPlayer();
  } else {
    const poll = setInterval(() => {
      if (typeof YT !== 'undefined' && YT.Player) {
        clearInterval(poll); langPlayerReady = true; createPlayer();
      }
    }, 100);
  }
}

function closeLangModal() {
  langModal.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(() => {
    if (langPlayer) { try { langPlayer.destroy(); } catch (e) {} langPlayer = null; }
    const c = document.getElementById('lang-player-container');
    if (c) c.innerHTML = '<div id="lang-youtube-player"></div>';
  }, 350);
}

if (langModalClose) langModalClose.addEventListener('click', closeLangModal);
if (langModal)      langModal.addEventListener('click', e => { if (e.target === langModal) closeLangModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && langModal?.classList.contains('show')) closeLangModal();
});
document.querySelectorAll('.lang-tag').forEach(tag => {
  tag.addEventListener('click', () => openLangVideo(tag.dataset.video, tag.dataset.lang));
});
