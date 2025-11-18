// Swiper: Featured works
const swiper = new Swiper('.featured-swiper', {
  slidesPerView: 1.2,
  spaceBetween: 10,
  loop: true,
  grabCursor: true,
  centeredSlides: true,
  pagination: { el: '.swiper-pagination', clickable: true, dynamicBullets: true },
  navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
  autoplay: {
    delay: 3000,
    disableOnInteraction: false, // we manage pause/resume manually
  },
  breakpoints: {
    768: { slidesPerView: 2, spaceBetween: 10 },
    1024: { slidesPerView: 3, spaceBetween: 15 },
  },
});

// Autoplay pause/resume logic
let pauseTimer;
function pauseAutoplay() {
  swiper.autoplay.stop();
  clearTimeout(pauseTimer);
  pauseTimer = setTimeout(() => {
    swiper.autoplay.start();
  }, 15000); // resume after 15s
}

// Pause on user interaction only
swiper.on('touchStart', pauseAutoplay);
document.querySelector('.swiper-button-next').addEventListener('click', pauseAutoplay);
document.querySelector('.swiper-button-prev').addEventListener('click', pauseAutoplay);

// Hamburger menu
const hamburger = document.querySelector('.hamburger');
const navMenu = document.getElementById('nav-menu');
hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));
document.querySelectorAll('#nav-menu a').forEach(link => {
  link.addEventListener('click', () => navMenu.classList.remove('active'));
});

// Smooth scroll for hero CTA
document.querySelector('.cta').addEventListener('click', e => {
  e.preventDefault();
  document.querySelector('#teasers').scrollIntoView({ behavior: 'smooth' });
});

// Back-to-top logic
const backToTopBtn = document.querySelector('.back-to-top');
const scrollContainer = document.querySelector('.parallax');
function handleScroll() {
  if (!scrollContainer) return;
  const scrollTop = scrollContainer.scrollTop; // Fixed: Direct access to scrollTop
  if (scrollTop > 100) {
    backToTopBtn.classList.add('show');
  } else {
    backToTopBtn.classList.remove('show');
  }
}
scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
backToTopBtn.addEventListener('click', () => {
  scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
});

// Gallery tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    tabPanels.forEach(panel => panel.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxInner = document.querySelector('.lightbox-inner');
const lightboxImg = document.querySelector('.lightbox-img');
const closeBtn = document.querySelector('.lightbox-close');
const prevBtn = document.querySelector('.lightbox-prev');
const nextBtn = document.querySelector('.lightbox-next');

// Collect ALL gallery items across tabs
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

// Fixed: Consolidated declarations (removed duplicates)
let currentIndex = 0;
let lightboxActive = false;
let scale = 1;
let currentX = 0;
let currentY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

// Open lightbox
function showLightbox(index, pushState = true) {
  const bg = galleryItems[index].style.backgroundImage;
  const url = bg.slice(5, -2);
  lightboxImg.src = url;

  // Reset zoom/pan
  scale = 1;
  currentX = 0;
  currentY = 0;
  lightboxImg.classList.remove('zoomed');
  lightboxImg.style.transform = 'scale(1)';

  lightbox.classList.add('show');
  currentIndex = index;
  lightboxActive = true;

  if (pushState) {
    history.pushState({ lightbox: true }, '', '#lightbox');
  }
}

function closeLightbox(popState = false) {
  lightbox.classList.remove('show');
  lightboxActive = false;
  currentX = 0;
  currentY = 0;
  scale = 1;
  if (!popState && history.state?.lightbox) {
    history.back();
  }
}

function updateTransform() {
  lightboxImg.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
}

function clampPan() {
  if (scale <= 1) {
    currentX = 0;
    currentY = 0;
    return;
  }
  const imgRect = lightboxImg.getBoundingClientRect();
  const containerRect = lightboxInner.getBoundingClientRect();
  const maxX = Math.max(0, (imgRect.width - containerRect.width) / 2);
  const maxY = Math.max(0, (imgRect.height - containerRect.height) / 2);
  currentX = Math.min(maxX, Math.max(-maxX, currentX));
  currentY = Math.min(maxY, Math.max(-maxY, currentY));
}

// Open lightbox on click
galleryItems.forEach((item, index) => {
  item.addEventListener('click', () => showLightbox(index));
});

// Close
closeBtn.addEventListener('click', () => closeLightbox());
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

// Next/Prev
nextBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % galleryItems.length;
  showLightbox(currentIndex, false);
});
prevBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
  showLightbox(currentIndex, false);
});

// Keyboard
document.addEventListener('keydown', e => {
  if (!lightboxActive) return;
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'Escape') closeLightbox();
});

// NEW IMPROVED MOBILE TOUCH HANDLING
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let isPotentialSwipe = true;  // becomes false if we detect pinch or vertical scroll

lightbox.addEventListener('touchstart', (e) => {
  if (!lightboxActive) return;

  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = Date.now();

  // If already zoomed OR more than 1 finger → this is pinch/pan, NOT swipe
  if (scale > 1 || e.touches.length > 1) {
    isPotentialSwipe = false;
  } else {
    isPotentialSwipe = true;
  }

  // If zoomed and single finger → allow panning (your existing pan code already handles this)
  if (scale > 1 && e.touches.length === 1) {
    isDragging = true;
    startX = touch.clientX - currentX;
    startY = touch.clientY - currentY;
  }
});

lightbox.addEventListener('touchmove', (e) => {
  if (!lightboxActive) return;

  // If more than one finger → definitely pinch zoom → block swipe completely
  if (e.touches.length > 1) {
    isPotentialSwipe = false;
    return;
  }

  // If we're zoomed and dragging the image → don't allow swipe
  if (scale > 1) {
    isPotentialSwipe = false;
  }

  // Optional: if vertical movement is big → treat as scroll, not swipe
  const touch = e.touches[0];
  const deltaY = Math.abs(touch.clientY - touchStartY);
  const deltaX = Math.abs(touch.clientX - touchStartX);
  if (deltaY > deltaX + 20) {  // user is scrolling vertically more than horizontally
    isPotentialSwipe = false;
  }
});

lightbox.addEventListener('touchend', (e) => {
  if (!lightboxActive || !isPotentialSwipe) {
    isDragging = false;
    return;
  }

  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaTime = Date.now() - touchStartTime;
  const threshold = 50;
  const swipeTimeThreshold = 500; // ignore very slow swipes

  if (deltaTime < swipeTimeThreshold && Math.abs(deltaX) > threshold) {
    if (deltaX > 0) {
      prevBtn.click();  // swiped right → previous
    } else {
      nextBtn.click();  // swiped left → next
    }
  }

  isDragging = false;
});

// Old codes for lightbox

// History back
window.addEventListener('popstate', e => {
  if (lightboxActive && !e.state?.lightbox) {
    closeLightbox(true);
  }
});

// Toggle zoom on click (fixed: apply transform immediately on zoom in)
lightboxImg.addEventListener('click', e => {
  e.stopPropagation();
  if (scale === 1) {
    scale = 2; // zoom in
    lightboxImg.classList.add('zoomed');
    currentX = 0;
    currentY = 0;
    updateTransform(); // Apply scale immediately
  } else {
    scale = 1; // zoom out
    lightboxImg.classList.remove('zoomed');
    currentX = 0;
    currentY = 0;
    updateTransform();
  }
});

// Hover-pan when zoomed (fixed: sync with currentX/Y and clamp)
lightboxInner.addEventListener('mousemove', e => {
  if (scale <= 1) return;

  const rect = lightboxInner.getBoundingClientRect();
  const x = e.clientX - rect.left;   // mouse X inside container
  const y = e.clientY - rect.top;    // mouse Y inside container

  // Normalize to -0.5 … +0.5
  const offsetX = (x / rect.width - 0.5) * 2;
  const offsetY = (y / rect.height - 0.5) * 2;

  // Max pan distance (adjust multiplier for sensitivity)
  const maxPanX = (scale - 1) * rect.width / 2;
  const maxPanY = (scale - 1) * rect.height / 2;

  currentX = -offsetX * maxPanX;
  currentY = -offsetY * maxPanY;
  clampPan();
  updateTransform();
});
