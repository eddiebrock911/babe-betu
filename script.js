/* ============================================================
   ANKIT & NAINCY — Main Script
   Advanced interactions, animations & features
   ============================================================ */

// ─── CONFIG ───────────────────────────────────────────────
const CORRECT_PASSWORD = "naincy";
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
  const ok = val === CORRECT_PASSWORD;

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

// ─── ROMANTIC MUSIC PLAYER ────────────────────────────────
// Royalty-free romantic / soft tracks (Internet Archive + SoundHelix)
const PLAYLIST = [
  {
    title: "Soft Hearts",
    artist: "For Naincy 💕",
    emoji: "💗",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    title: "Moonlight Whisper",
    artist: "Romantic Nights 🌙",
    emoji: "🌙",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    title: "Cherry Blossom",
    artist: "Our Spring 🌸",
    emoji: "🌸",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  },
  {
    title: "Forever Yours",
    artist: "Love Notes 💌",
    emoji: "💌",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
  },
  {
    title: "Starlit Dance",
    artist: "Ankit & Naincy ✨",
    emoji: "✨",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3"
  },
  {
    title: "Golden Hour",
    artist: "Sweet Moments ☀️",
    emoji: "☀️",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"
  }
];

let musicPlaying = false;
let currentTrack = 0;
let isShuffle = false;
let isRepeat = false; // false | 'one' | 'all'
let lastVolume = 0.55;
let seeking = false;

function getAudio() {
  return document.getElementById("bg-music");
}

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ":" + String(s).padStart(2, "0");
}

function setVolumeUI(vol) {
  const slider = document.getElementById("volume-slider");
  const pct = document.getElementById("vol-pct");
  const icon = document.getElementById("vol-icon");
  const v = Math.round(vol * 100);
  if (slider) {
    slider.value = v;
    slider.style.setProperty("--vol", v + "%");
  }
  if (pct) pct.textContent = v + "%";
  if (icon) {
    if (v === 0) icon.className = "fas fa-volume-mute";
    else if (v < 40) icon.className = "fas fa-volume-down";
    else icon.className = "fas fa-volume-up";
  }
}

function updateNowPlaying() {
  const track = PLAYLIST[currentTrack];
  if (!track) return;
  const title = document.getElementById("player-title");
  const artist = document.getElementById("player-artist");
  const art = document.getElementById("player-art-icon");
  const label = document.getElementById("music-label");
  if (title) title.textContent = track.title;
  if (artist) artist.textContent = track.artist;
  if (art) art.textContent = track.emoji;
  if (label) label.textContent = musicPlaying ? "Playing" : "Music";
  renderPlaylist();
}

function renderPlaylist() {
  const list = document.getElementById("player-playlist");
  const count = document.getElementById("playlist-count");
  if (!list) return;
  if (count) count.textContent = PLAYLIST.length + " songs";

  list.innerHTML = PLAYLIST.map((t, i) => {
    const active = i === currentTrack;
    const numHtml =
      active && musicPlaying
        ? `<span class="playlist-num playing-eq"><i></i><i></i><i></i></span>`
        : `<span class="playlist-num">${i + 1}</span>`;
    return `
      <button type="button" class="playlist-item${active ? " active" : ""}" onclick="playTrack(${i})" aria-label="Play ${t.title}">
        ${numHtml}
        <div class="playlist-info">
          <div class="playlist-title">${t.title}</div>
          <div class="playlist-sub">${t.artist}</div>
        </div>
        <span class="playlist-emoji">${t.emoji}</span>
      </button>`;
  }).join("");
}

function loadTrack(index, autoplay = false) {
  const audio = getAudio();
  if (!audio || !PLAYLIST.length) return;
  currentTrack = ((index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
  const track = PLAYLIST[currentTrack];
  audio.src = track.src;
  audio.load();
  updateNowPlaying();
  updateProgress(0, 0);

  if (autoplay) {
    audio.play()
      .then(() => setPlayingState(true))
      .catch(() => setPlayingState(false));
  }
}

function setPlayingState(playing) {
  musicPlaying = playing;
  const navBtn = document.getElementById("music-btn");
  const panel = document.getElementById("player-panel");
  const playIcon = document.getElementById("play-icon");
  const label = document.getElementById("music-label");

  if (navBtn) navBtn.classList.toggle("playing", playing);
  if (panel) panel.classList.toggle("playing", playing);
  if (playIcon) playIcon.className = playing ? "fas fa-pause" : "fas fa-play";
  if (label) label.textContent = playing ? "Playing" : "Music";
  renderPlaylist();
}

function toggleMusic() {
  const audio = getAudio();
  if (!audio) return;

  if (!audio.src) {
    loadTrack(currentTrack, true);
    return;
  }

  if (musicPlaying) {
    audio.pause();
    setPlayingState(false);
  } else {
    audio.play()
      .then(() => setPlayingState(true))
      .catch(() => setPlayingState(false));
  }
}

function playTrack(index) {
  loadTrack(index, true);
}

function nextTrack() {
  if (isShuffle) {
    let n;
    do {
      n = Math.floor(Math.random() * PLAYLIST.length);
    } while (n === currentTrack && PLAYLIST.length > 1);
    loadTrack(n, true);
  } else {
    loadTrack(currentTrack + 1, true);
  }
}

function prevTrack() {
  const audio = getAudio();
  // If past 3s, restart current song
  if (audio && audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  if (isShuffle) {
    nextTrack();
  } else {
    loadTrack(currentTrack - 1, true);
  }
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  const btn = document.getElementById("shuffle-btn");
  if (btn) btn.classList.toggle("active", isShuffle);
}

function toggleRepeat() {
  // cycle: off → all → one → off
  if (!isRepeat) isRepeat = "all";
  else if (isRepeat === "all") isRepeat = "one";
  else isRepeat = false;

  const btn = document.getElementById("repeat-btn");
  if (btn) {
    btn.classList.toggle("active", !!isRepeat);
    btn.title =
      isRepeat === "one" ? "Repeat one" : isRepeat === "all" ? "Repeat all" : "Repeat off";
    const icon = btn.querySelector("i");
    if (icon) {
      icon.className = isRepeat === "one" ? "fas fa-redo" : "fas fa-redo";
      icon.style.opacity = isRepeat ? "1" : "";
    }
    // small badge feel via data attr
    btn.dataset.mode = isRepeat || "off";
  }
}

function toggleMute() {
  const audio = getAudio();
  if (!audio) return;
  if (audio.volume > 0) {
    lastVolume = audio.volume;
    audio.volume = 0;
  } else {
    audio.volume = lastVolume || 0.55;
  }
  setVolumeUI(audio.volume);
}

function updateProgress(current, duration) {
  const fill = document.getElementById("player-progress-fill");
  const thumb = document.getElementById("player-progress-thumb");
  const curEl = document.getElementById("player-current");
  const durEl = document.getElementById("player-duration");
  const pct = duration > 0 ? (current / duration) * 100 : 0;

  if (fill) fill.style.width = pct + "%";
  if (thumb) thumb.style.left = pct + "%";
  if (curEl) curEl.textContent = formatTime(current);
  if (durEl) durEl.textContent = formatTime(duration);
}

function seekFromEvent(e) {
  const audio = getAudio();
  const bar = document.getElementById("player-progress");
  if (!audio || !bar || !audio.duration) return;
  const rect = bar.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  let ratio = (clientX - rect.left) / rect.width;
  ratio = Math.max(0, Math.min(1, ratio));
  audio.currentTime = ratio * audio.duration;
  updateProgress(audio.currentTime, audio.duration);
}

function togglePlayerPanel() {
  const panel = document.getElementById("player-panel");
  const backdrop = document.getElementById("player-backdrop");
  if (!panel) return;
  const open = !panel.classList.contains("open");
  panel.classList.toggle("open", open);
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  if (backdrop) backdrop.classList.toggle("open", open);
}

function initMusicPlayer() {
  const audio = getAudio();
  if (!audio) return;

  // Volume
  const savedVol = parseFloat(localStorage.getItem("naincykit_vol"));
  audio.volume = isFinite(savedVol) ? savedVol : 0.55;
  lastVolume = audio.volume || 0.55;
  setVolumeUI(audio.volume);

  const slider = document.getElementById("volume-slider");
  if (slider) {
    slider.addEventListener("input", () => {
      const v = Number(slider.value) / 100;
      audio.volume = v;
      if (v > 0) lastVolume = v;
      setVolumeUI(v);
      localStorage.setItem("naincykit_vol", String(v));
    });
  }

  // Progress events
  audio.addEventListener("timeupdate", () => {
    if (!seeking) updateProgress(audio.currentTime, audio.duration || 0);
  });
  audio.addEventListener("loadedmetadata", () => {
    updateProgress(audio.currentTime, audio.duration || 0);
  });
  audio.addEventListener("ended", () => {
    if (isRepeat === "one") {
      audio.currentTime = 0;
      audio.play().catch(() => setPlayingState(false));
    } else if (isRepeat === "all" || isShuffle) {
      nextTrack();
    } else if (currentTrack < PLAYLIST.length - 1) {
      nextTrack();
    } else {
      setPlayingState(false);
      updateProgress(0, audio.duration || 0);
    }
  });
  audio.addEventListener("play", () => setPlayingState(true));
  audio.addEventListener("pause", () => {
    // only mark paused if not switching tracks mid-load
    if (!audio.seeking) setPlayingState(false);
  });

  // Seek bar
  const bar = document.getElementById("player-progress");
  if (bar) {
    const onDown = (e) => {
      seeking = true;
      bar.classList.add("dragging");
      seekFromEvent(e);
    };
    const onMove = (e) => {
      if (seeking) seekFromEvent(e);
    };
    const onUp = () => {
      seeking = false;
      bar.classList.remove("dragging");
    };
    bar.addEventListener("mousedown", onDown);
    bar.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
  }

  // Load first track metadata (no autoplay — browser policy)
  loadTrack(0, false);
  renderPlaylist();
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
    const panel = document.getElementById("player-panel");
    if (panel && panel.classList.contains("open")) {
      togglePlayerPanel();
    }
  }
  // Don't hijack arrows when typing
  const tag = (e.target && e.target.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.key === "ArrowRight") nextSlide();
  if (e.key === "ArrowLeft") prevSlide();
  if (e.key === " " && document.getElementById("player-panel")?.classList.contains("open")) {
    e.preventDefault();
    toggleMusic();
  }
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

// ─── CUSTOM ANIMATED CURSOR ────────────────────────────────
const CURSOR_HOVER_SELECTOR =
  "a, button, input, textarea, select, [role='button'], [role='slider'], [onclick]";
const CURSOR_SPARKLES = ["💕", "✨", "💫", "🌸"];

function spawnCursorSpark(layer, x, y) {
  const s = document.createElement("span");
  s.className = "cursor-spark";
  s.textContent = CURSOR_SPARKLES[Math.floor(Math.random() * CURSOR_SPARKLES.length)];
  s.style.left = x + "px";
  s.style.top = y + "px";
  s.style.setProperty("--spark-size", 10 + Math.random() * 6 + "px");
  layer.appendChild(s);
  setTimeout(() => s.remove(), 900);
}

function initCustomCursor() {
  // Only enable on devices with a real mouse — skip touch / coarse pointers
  const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fineHover || reduceMotion) return;

  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  const sparkLayer = document.getElementById("cursor-particles");
  if (!dot || !ring) return;

  document.body.classList.add("has-custom-cursor");

  let mx = 0, my = 0;
  let dx = 0, dy = 0, rx = 0, ry = 0;
  let started = false;
  let lastSpark = 0;

  function onMove(e) {
    mx = e.clientX;
    my = e.clientY;
    if (!started) {
      started = true;
      dx = rx = mx;
      dy = ry = my;
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    }
    const now = performance.now();
    if (sparkLayer && now - lastSpark > 110) {
      lastSpark = now;
      spawnCursorSpark(sparkLayer, mx, my);
    }
  }
  function onDown() {
    ring.classList.add("cursor-click");
    dot.classList.add("cursor-click");
  }
  function onUp() {
    ring.classList.remove("cursor-click");
    dot.classList.remove("cursor-click");
  }
  function onOver(e) {
    if (e.target.closest && e.target.closest(CURSOR_HOVER_SELECTOR)) {
      ring.classList.add("cursor-hover");
    }
  }
  function onOut(e) {
    if (e.target.closest && e.target.closest(CURSOR_HOVER_SELECTOR)) {
      ring.classList.remove("cursor-hover");
    }
  }
  // Bail out gracefully if a real touch ever lands (hybrid touch+mouse devices)
  function onTouch() {
    document.body.classList.remove("has-custom-cursor");
    dot.style.opacity = "0";
    ring.style.opacity = "0";
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mousedown", onDown);
    window.removeEventListener("mouseup", onUp);
    document.removeEventListener("mouseover", onOver);
    document.removeEventListener("mouseout", onOut);
  }

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("mousedown", onDown);
  window.addEventListener("mouseup", onUp);
  document.addEventListener("mouseover", onOver, { passive: true });
  document.addEventListener("mouseout", onOut, { passive: true });
  window.addEventListener("touchstart", onTouch, { passive: true, once: true });

  function loop() {
    if (started) {
      // dot tracks almost instantly, ring glides behind with a soft spring lag
      dx += (mx - dx) * 0.9;
      dy += (my - dy) * 0.9;
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  createPwStars();
  initLightbox();
  initParallax();
  enhanceHero();
  initCustomCursor();
  initMusicPlayer();
  resetSlideTimer();
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Theme restore
  if (localStorage.getItem("naincykit_theme") === "light") {
    document.body.classList.add("light");
    const icon = document.querySelector(".theme-toggle i");
    if (icon) icon.className = "fas fa-sun";
  }

  // Always show password screen on every visit / refresh
  const pw = document.getElementById("pw-input");
  if (pw) {
    setTimeout(() => pw.focus(), 400);
  }
});

// Expose for inline handlers
window.checkPassword = checkPassword;
window.togglePwVisibility = togglePwVisibility;
window.toggleMusic = toggleMusic;
window.togglePlayerPanel = togglePlayerPanel;
window.playTrack = playTrack;
window.nextTrack = nextTrack;
window.prevTrack = prevTrack;
window.toggleShuffle = toggleShuffle;
window.toggleRepeat = toggleRepeat;
window.toggleMute = toggleMute;
window.toggleTheme = toggleTheme;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.goSlide = goSlide;
window.openZoom = openZoom;
window.openZoomFromPolaroid = openZoomFromPolaroid;
window.closeZoom = closeZoom;
window.scrollToTop = scrollToTop;
window.shareOnWhatsApp = shareOnWhatsApp;