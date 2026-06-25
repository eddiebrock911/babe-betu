/* ===== PASSWORD ===== */
const CORRECT_PASSWORD = "naincy"; // 🔑 Change this password!

function checkPassword() {
  const val = document.getElementById('pw-input').value.trim().toLowerCase();
  const err = document.getElementById('pw-error');
  if (val === CORRECT_PASSWORD) {
    err.textContent = '';
    const card = document.getElementById('pw-card');
    const screen = document.getElementById('password-screen');
    card.classList.add('unlocking');
    setTimeout(() => {
      screen.classList.add('hiding');
      const main = document.getElementById('main-content');
      main.style.display = 'block';
      setTimeout(() => {
        main.classList.add('visible');
        screen.style.display = 'none';
        initHearts();
        initStars();
        initReveal();
        startSlideshow();
      }, 800);
    }, 400);
  } else {
    err.textContent = 'Hmm, that\'s not right 💔 Try again!';
    const input = document.getElementById('pw-input');
    input.style.borderColor = '#ff6b9d';
    input.value = '';
    setTimeout(() => { input.style.borderColor = ''; }, 1500);
    // shake
    const card = document.getElementById('pw-card');
    card.style.animation = 'shake 0.4s ease';
    setTimeout(() => card.style.animation = '', 400);
  }
}

function togglePwVisibility() {
  const input = document.getElementById('pw-input');
  const btn = document.getElementById('pw-toggle');
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

// Shake keyframe for wrong password
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}';
document.head.appendChild(styleEl);

/* ===== PW SCREEN STARS ===== */
(function initPwStars() {
  const container = document.getElementById('pw-stars');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'pw-star';
    const size = Math.random() * 2.5 + 0.5;
    s.style.cssText = `
      width:${size}px;height:${size}px;
      left:${Math.random()*100}%;top:${Math.random()*100}%;
      --d:${Math.random()*3+2}s;
      --delay:${Math.random()*4}s;
    `;
    container.appendChild(s);
  }
})();

/* ===== FLOATING HEARTS ===== */
function initHearts() {
  const layer = document.getElementById('hearts-layer');
  const symbols = ['💕','💖','🌸','✨','💫','🌺','💗','🌷'];
  for (let i = 0; i < 22; i++) {
    const h = document.createElement('div');
    h.className = 'heart-particle';
    h.textContent = symbols[Math.floor(Math.random()*symbols.length)];
    const size = Math.random() * 14 + 10;
    const left = Math.random() * 95 + '%';
    const dur = Math.random() * 10 + 8;
    const delay = Math.random() * 12;
    const drift = (Math.random() - 0.5) * 120;
    const rot = (Math.random() - 0.5) * 40;
    h.style.cssText = `
      --hs:${size}px;--hleft:${left};
      --hd:${dur}s;--hdelay:${delay}s;
      --hdrift:${drift}px;--hrot:${rot}deg;
    `;
    layer.appendChild(h);
  }
}

/* ===== STARS BG ===== */
function initStars() {
  const bg = document.getElementById('cosmic-bg');
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div');
    const size = Math.random() * 2 + 0.5;
    s.style.cssText = `
      position:absolute;border-radius:50%;background:white;
      width:${size}px;height:${size}px;
      left:${Math.random()*100}%;top:${Math.random()*100}%;
      opacity:${Math.random()*0.6+0.1};
      animation:twinkle ${Math.random()*4+2}s ease-in-out infinite ${Math.random()*5}s;
    `;
    bg.appendChild(s);
  }
}

/* ===== SCROLL REVEAL ===== */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); } });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

/* ===== SLIDESHOW ===== */
let currentSlide = 0;
let slideshowTimer;
const SLIDE_COUNT = 4;

function goSlide(n) {
  document.getElementById('slide-' + currentSlide).classList.remove('active');
  document.querySelectorAll('.slide-dot')[currentSlide].classList.remove('active');
  currentSlide = (n + SLIDE_COUNT) % SLIDE_COUNT;
  document.getElementById('slide-' + currentSlide).classList.add('active');
  document.querySelectorAll('.slide-dot')[currentSlide].classList.add('active');
}

function nextSlide() { clearInterval(slideshowTimer); goSlide(currentSlide + 1); startSlideshow(); }
function prevSlide() { clearInterval(slideshowTimer); goSlide(currentSlide - 1); startSlideshow(); }

function startSlideshow() {
  slideshowTimer = setInterval(() => { goSlide(currentSlide + 1); }, 4000);
}

/* ===== MUSIC ===== */
let musicPlaying = false;
const audio = document.getElementById('bg-music');
audio.volume = 0.35;

function toggleMusic() {
  const btn = document.getElementById('music-btn');
  const label = document.getElementById('music-label');
  const note = document.getElementById('music-note');
  if (!musicPlaying) {
    audio.play().catch(() => {});
    musicPlaying = true;
    label.textContent = 'Pause Music';
    btn.classList.add('playing');
  } else {
    audio.pause();
    musicPlaying = false;
    label.textContent = 'Play Music';
    btn.classList.remove('playing');
  }
}

/* ===== ZOOM ===== */
function openZoom(el) {
  const img = el.querySelector('img');
  if (!img) return;
  document.getElementById('zoom-img').src = img.src;
  document.getElementById('zoom-overlay').classList.add('active');
}

function openZoomFromPolaroid(el) {
  const img = el.querySelector('.polaroid-img img');
  if (!img) return;
  document.getElementById('zoom-img').src = img.src;
  document.getElementById('zoom-overlay').classList.add('active');
}

function closeZoom() {
  document.getElementById('zoom-overlay').classList.remove('active');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeZoom(); });

/* ===== THEME TOGGLE ===== */
function toggleTheme() {
  const body = document.body;
  const btn = document.querySelector('.theme-toggle');
  const icon = btn ? btn.querySelector('i') : null;
  const isLight = body.getAttribute('data-theme') === 'light';

  if (isLight) {
    body.removeAttribute('data-theme');
    if (icon) { icon.className = 'fas fa-moon'; }
    localStorage.setItem('theme', 'dark');
  } else {
    body.setAttribute('data-theme', 'light');
    if (icon) { icon.className = 'fas fa-sun'; }
    localStorage.setItem('theme', 'light');
  }
}

// On page load, restore saved theme
(function applySavedTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.setAttribute('data-theme', 'light');
    // icon will be set once DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      const icon = document.querySelector('.theme-toggle i');
      if (icon) icon.className = 'fas fa-sun';
    });
  }
})();

// ========== Back to Top Button ==========
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
