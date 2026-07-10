/* ============================================================
   ANKIT & NAINCY — Main Script
   Advanced interactions, animations & features
   ============================================================ */

// ─── CONFIG ───────────────────────────────────────────────
const CORRECT_PASSWORD = "iloveyou"; // hint: special me between you
const START_DATE = new Date("2026-05-29T20:17:00");

// ─── PASSWORD ─────────────────────────────────────────────
function createPwStars() {
  const layer = document.getElementById("pw-stars");
  if (!layer) return;
  for (let i = 0; i < 60; i++) {
    const s = document.createElement("div");
    s.className = "pw-star";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.setProperty("--d", 2 + Math.random() * 4 + "s");
    s.style.animationDelay = Math.random() * 3 + "s";
    s.style.width = s.style.height = 1 + Math.random() * 3 + "px";
    layer.appendChild(s);
  }
}

function togglePwVisibility() {
  const input = document.getElementById("pw-input");
  const btn = document.getElementById("pw-toggle");
  if (!input) return;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  if (btn) btn.textContent = show ? "🙈" : "👁️";
}

function checkPassword() {
  const input = document.getElementById("pw-input");
  const err = document.getElementById("pw-error");
  if (!input) return;

  const val = input.value.trim().toLowerCase().replace(/\s+/g, "");
  const ok =
    val === CORRECT_PASSWORD;

  if (ok) {
    unlockWorld();
  } else {
    if (err) {
      err.textContent = "Hmm, not quite… try again 💌";
      err.classList.add("show");
      setTimeout(() => err.classList.remove("show"), 2500);
    }
    input.classList.add("shake");
    const card = document.getElementById("pw-card");
    if (card) {
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "shake 0.4s ease";
    }
  }
}

function unlockWorld() {
  spawnConfetti();
  const screen = document.getElementById("password-screen");
  const main = document.getElementById("main-content");
  if (screen) screen.classList.add("unlocked");
  if (main) main.classList.add("visible");
  sessionStorage.setItem("naincykit_unlocked", "1");
  initHearts();
  startCounter();
  observeReveals();
}

function spawnConfetti() {
  const colors = ["#ff4d8d", "#9b5cff", "#ffd6a0", "#ff7aa8", "#c4a1ff", "#fff", "#ff9ec8"];
  for (let i = 0; i < 50; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.setProperty("--cd", 2 + Math.random() * 2.5 + "s");
    p.style.animationDelay = Math.random() * 0.5 + "s";
    p.style.width = 6 + Math.random() * 8 + "px";
    p.style.height = 6 + Math.random() * 8 + "px";
    p.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 4000);
  }
}

// ─── FLOATING HEARTS ──────────────────────────────────────
function initHearts() {
  const layer = document.getElementById("hearts-layer");
  if (!layer || layer.dataset.ready) return;
  layer.dataset.ready = "1";
  const emojis = ["💕", "💗", "🌸", "✨", "💖", "🦋", "🌺", "💫"];
  for (let i = 0; i < 18; i++) {
    const h = document.createElement("span");
    h.className = "float-heart";
    h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    h.style.left = Math.random() * 100 + "%";
    h.style.setProperty("--size", 12 + Math.random() * 18 + "px");
    h.style.setProperty("--dur", 10 + Math.random() * 14 + "s");
    h.style.setProperty("--delay", Math.random() * 12 + "s");
    h.style.setProperty("--drift", -40 + Math.random() * 80 + "px");
    h.style.setProperty("--rot", -30 + Math.random() * 60 + "deg");
    h.style.setProperty("--op", 0.25 + Math.random() * 0.4);
    layer.appendChild(h);
  }
}

// ─── COUNTER ──────────────────────────────────────────────
function startCounter() {
  function tick() {
    const now = new Date();
    let diff = now - START_DATE;
    // If start is in the future, show countdown-style absolute (still beautiful)
    const future = diff < 0;
    diff = Math.abs(diff);

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    const d = document.getElementById("c-days");
    const h = document.getElementById("c-hours");
    const m = document.getElementById("c-mins");
    const s = document.getElementById("c-secs");

    if (d) d.textContent = days;
    if (h) h.textContent = String(hours).padStart(2, "0");
    if (m) m.textContent = String(mins).padStart(2, "0");
    if (s) s.textContent = String(secs).padStart(2, "0");

    // subtle pulse on seconds change
    if (s) {
      s.style.transform = "scale(1.08)";
      setTimeout(() => (s.style.transform = "scale(1)"), 150);
    }
  }
  tick();
  setInterval(tick, 1000);
}

// ─── REVEAL ON SCROLL ─────────────────────────────────────
function observeReveals() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  els.forEach((el) => io.observe(el));
}

// ─── SLIDESHOW ────────────────────────────────────────────
let currentSlide = 0;
let slideTimer = null;
const TOTAL_SLIDES = 4;

function goSlide(n) {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".slide-dot");
  if (!slides.length) return;
  currentSlide = ((n % slides.length) + slides.length) % slides.length;
  slides.forEach((s, i) => s.classList.toggle("active", i === currentSlide));
  dots.forEach((d, i) => d.classList.toggle("active", i === currentSlide));
  resetSlideTimer();
}

function nextSlide() {
  goSlide(currentSlide + 1);
}

function prevSlide() {
  goSlide(currentSlide - 1);
}

function resetSlideTimer() {
  if (slideTimer) clearInterval(slideTimer);
  slideTimer = setInterval(nextSlide, 4500);
}

// ─── ZOOM ─────────────────────────────────────────────────
function openZoom(el) {
  const img = el.querySelector("img");
  if (!img || !img.src) return;
  const overlay = document.getElementById("zoom-overlay");
  const zoomImg = document.getElementById("zoom-img");
  if (!overlay || !zoomImg) return;
  zoomImg.src = img.src;
  zoomImg.alt = img.alt || "Photo";
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function openZoomFromPolaroid(el) {
  openZoom(el);
}

function closeZoom() {
  const overlay = document.getElementById("zoom-overlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

// ─── MUSIC ────────────────────────────────────────────────
let musicPlaying = false;

function toggleMusic() {
  const audio = document.getElementById("bg-music");
  const btn = document.getElementById("music-btn");
  const label = document.getElementById("music-label");
  if (!audio) return;

  if (musicPlaying) {
    audio.pause();
    musicPlaying = false;
    if (btn) btn.classList.remove("playing");
    if (label) label.textContent = "Play Music";
  } else {
    audio.volume = 0.45;
    audio.play().catch(() => {});
    musicPlaying = true;
    if (btn) btn.classList.add("playing");
    if (label) label.textContent = "Pause";
  }
}

// ─── THEME ────────────────────────────────────────────────
function toggleTheme() {
  document.body.classList.toggle("light");
  const icon = document.querySelector(".theme-toggle i");
  const isLight = document.body.classList.contains("light");
  if (icon) {
    icon.className = isLight ? "fas fa-sun" : "fas fa-moon";
  }
  localStorage.setItem("naincykit_theme", isLight ? "light" : "dark");
}

// ─── SCROLL / NAV ─────────────────────────────────────────
function onScroll() {
  const nav = document.querySelector(".nav");
  const topBtn = document.querySelector(".back-to-top");
  const y = window.scrollY;
  if (nav) nav.classList.toggle("scrolled", y > 40);
  if (topBtn) topBtn.classList.toggle("show", y > 500);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── WHATSAPP SHARE ───────────────────────────────────────
function shareOnWhatsApp() {
  const text = encodeURIComponent(
    "💕 Look at this beautiful little world made for Naincy by Ankit 🌸\nhttps://naincykit.onrender.com"
  );
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
}

// ─── LIGHTBOX (legacy support) ────────────────────────────
function initLightbox() {
  const lb = document.getElementById("lightbox");
  const close = document.getElementById("lightboxClose");
  if (close) {
    close.addEventListener("click", () => {
      if (lb) {
        lb.classList.remove("open");
        lb.setAttribute("aria-hidden", "true");
      }
    });
  }
  if (lb) {
    lb.addEventListener("click", (e) => {
      if (e.target === lb) {
        lb.classList.remove("open");
        lb.setAttribute("aria-hidden", "true");
      }
    });
  }
}

// ─── KEYBOARD ─────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeZoom();
    const chat = document.getElementById("chat-box");
    if (chat && chat.classList.contains("open")) {
      chat.classList.remove("open");
    }
  }
  if (e.key === "ArrowRight") nextSlide();
  if (e.key === "ArrowLeft") prevSlide();
});

// ─── PARALLAX ORBS (subtle) ───────────────────────────────
function initParallax() {
  const orbs = document.querySelectorAll(".orb");
  if (!orbs.length) return;
  let mx = 0, my = 0, cx = 0, cy = 0;
  window.addEventListener(
    "mousemove",
    (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 20;
      my = (e.clientY / window.innerHeight - 0.5) * 20;
    },
    { passive: true }
  );
  function loop() {
    cx += (mx - cx) * 0.05;
    cy += (my - cy) * 0.05;
    orbs.forEach((orb, i) => {
      const f = (i + 1) * 0.4;
      orb.style.marginLeft = cx * f + "px";
      orb.style.marginTop = cy * f + "px";
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// ─── TYPED HERO EFFECT (optional polish) ──────────────────
function enhanceHero() {
  const title = document.querySelector(".hero-title");
  if (!title) return;
  // soft shimmer on em
  const em = title.querySelector("em");
  if (em) {
    em.style.backgroundSize = "200% auto";
    em.style.animation = "gradient-shift 4s ease infinite";
  }
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  createPwStars();
  initLightbox();
  initParallax();
  enhanceHero();
  resetSlideTimer();
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Theme restore
  if (localStorage.getItem("naincykit_theme") === "light") {
    document.body.classList.add("light");
    const icon = document.querySelector(".theme-toggle i");
    if (icon) icon.className = "fas fa-sun";
  }

  // // Auto-unlock if already unlocked this session isse baar baar password nahi dalna padega


  // if (sessionStorage.getItem("naincykit_unlocked") === "1") {
  //   const screen = document.getElementById("password-screen");
  //   const main = document.getElementById("main-content");
  //   if (screen) screen.classList.add("unlocked");
  //   if (main) main.classList.add("visible");
  //   initHearts();
  //   startCounter();
  //   observeReveals();
  // }

  // Focus password input
  const pw = document.getElementById("pw-input");
  if (pw && !sessionStorage.getItem("naincykit_unlocked")) {
    setTimeout(() => pw.focus(), 400);
  }
});

// Expose for inline handlers
window.checkPassword = checkPassword;
window.togglePwVisibility = togglePwVisibility;
window.toggleMusic = toggleMusic;
window.toggleTheme = toggleTheme;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.goSlide = goSlide;
window.openZoom = openZoom;
window.openZoomFromPolaroid = openZoomFromPolaroid;
window.closeZoom = closeZoom;
window.scrollToTop = scrollToTop;
//window.shareOnWhatsApp = shareOnWhatsApp;
