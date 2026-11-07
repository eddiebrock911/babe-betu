/* ============================================
   LIVE CHAT — PREMIUM EDITION 💎
   Project: naincyKit
   Features: 40+ Premium Features
   ============================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBGj9MkqAOUvGox8MEsaz7vPUOwQbAref4",
  authDomain: "naincykit.firebaseapp.com",
  databaseURL: "https://naincykit-default-rtdb.firebaseio.com",
  projectId: "naincykit",
  storageBucket: "naincykit.firebasestorage.app",
  messagingSenderId: "401758447692",
  appId: "1:401758447692:web:8928284aa8f7552290ece9"
};

window.NK = window.NK || {};
window.NK.utils = window.NK.utils || {
  dayKey(ts) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  },
  startOfDay(ts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  },
  messagePreview(msg) {
    if (!msg) return "";
    return (msg.text || "[media]").replace(/\s+/g, " ").slice(0, 48);
  },
  extractLinks(value) {
    if (!value || !value.toString) return [];
    const re = /(https?:\/\/|www\.)[^\s]+/gi;
    return (value.match(re) || []).filter(Boolean);
  },
  extractEmoji(text) {
    if (!text) return [];
    const regex = /(?:[\u2700-\u27BF]|[\u{1F300}-\u{1FAFF}]|[\u2600-\u26FF])/gu;
    return (text.match(regex) || []).filter(Boolean);
  }
};
window.NK.memories = window.NK.memories || { count: 0 };
window.NK.store = window.NK.store || {
  reactions: {},
  favorites: {},
  pinned: {},
  async loadAll() {
    const all = window.allMessages || {};
    return Object.entries(all).map(([key, msg]) => ({ ...(msg || {}), key }));
  }
};

// ─── DATE HELPERS (WhatsApp style: Today / Yesterday / date) ──────────────
const NK_DAY_MS = 24 * 60 * 60 * 1000;

function chatDayStart(ts) {
  const d = new Date(Number(ts) || Date.now());
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function chatDayDiff(ts, now = Date.now()) {
  return Math.round((chatDayStart(now) - chatDayStart(ts)) / NK_DAY_MS);
}

function dateFromDayKey(dayKey) {
  // "2026-11-07" → local Date (timezone safe, UTC parse bug fix)
  const parts = String(dayKey || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !n && n !== 0)) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * WhatsApp jaisa din ka label:
 *   aaj        → "Today"
 *   kal        → "Yesterday"
 *   pichle 6 din → weekday ("Monday")
 *   usse purana → "07/11/2026"
 */
function formatChatDateLabel(ts, now = Date.now()) {
  const t = Number(ts);
  if (!t || isNaN(t)) return "";
  const diff = chatDayDiff(t, now);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";

  const d = new Date(t);
  if (diff > 1 && diff < 7) {
    return d.toLocaleDateString(undefined, { weekday: "long" });
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function formatChatTime(ts) {
  const t = Number(ts);
  if (!t || isNaN(t)) return "";
  return new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatChatDateTime(ts) {
  return [formatChatDateLabel(ts), formatChatTime(ts)].filter(Boolean).join(" · ");
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  if (s < 60) return s + "s";
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

window.NK.date = {
  chatDayStart,
  chatDayDiff,
  dateFromDayKey,
  formatChatDateLabel,
  formatChatTime,
  formatChatDateTime
};

window.NK.dashboard = window.NK.dashboard || {
  cached: null,
  blank() {
    return {
      empty: true, total: 0, photos: 0, videos: 0, voice: 0,
      bySender: {}, participants: [], topSender: null, linkCount: 0,
      chatDays: 0, topDay: null, topEmoji: [], byHour: Array(24).fill(0),
      topHour: 0, avgPerDay: 0
    };
  },
  async compute(force = false) {
    if (!force && this.cached) return this.cached;

    const msgs = Object.entries(window.allMessages || {}).map(([key, m]) => ({ ...(m || {}), key }));
    if (!msgs.length) {
      this.cached = this.blank();
      return this.cached;
    }

    const bySender = {};
    const dayCounts = {};
    const emojiCounts = {};
    const hourCounts = Array(24).fill(0);
    let photos = 0, videos = 0, voice = 0, linkCount = 0;

    msgs.forEach((m) => {
      if (m.sender) bySender[m.sender] = (bySender[m.sender] || 0) + 1;
      if (m.type === "image") photos++;
      if (m.type === "video") videos++;
      if (m.type === "voice") voice++;

      const ts = Number(m.timestamp) || 0;
      if (ts) {
        const dk = window.NK.utils.dayKey(ts);
        dayCounts[dk] = (dayCounts[dk] || 0) + 1;
        const hour = new Date(ts).getHours();
        if (hour >= 0 && hour < 24) hourCounts[hour]++;
      }

      if (m.text) {
        linkCount += window.NK.utils.extractLinks(m.text).length;
        window.NK.utils.extractEmoji(m.text).forEach((e) => {
          emojiCounts[e] = (emojiCounts[e] || 0) + 1;
        });
      }
    });

    const total = msgs.length;
    const topSender = Object.entries(bySender).sort((a, b) => b[1] - a[1])[0] || null;
    const topDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0] || null;
    const topEmoji = Object.entries(emojiCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const chatDays = Object.keys(dayCounts).length;
    const peakHour = Math.max.apply(null, hourCounts);

    this.cached = {
      empty: false,
      total,
      photos,
      videos,
      voice,
      linkCount,
      chatDays,
      byHour: hourCounts,
      bySender,
      participants: Object.keys(bySender),
      topSender: topSender ? { name: topSender[0], count: topSender[1] } : null,
      topDay: topDayEntry
        ? { key: topDayEntry[0], count: topDayEntry[1], day: formatChatDateLabel(dateFromDayKey(topDayEntry[0]).getTime()) }
        : null,
      topEmoji,
      topHour: peakHour > 0 ? hourCounts.indexOf(peakHour) : 0,
      avgPerDay: chatDays ? Number((total / chatDays).toFixed(1)) : 0
    };

    return this.cached;
  },
  invalidate() {
    this.cached = null;
  }
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let storageRef = null;
try { storageRef = firebase.storage().ref(); } catch(e) {}

// ─── USER IDENTITY ────────────────────────────────────────
let myName = localStorage.getItem("chatName");
if (!myName) {
  myName = (prompt("What is your name? (Ankit or Naincy):") || "Guest").trim();
  if (!myName) myName = "Guest";
  localStorage.setItem("chatName", myName);
}

let myDeviceId = localStorage.getItem("chatDeviceId");
if (!myDeviceId) {
  myDeviceId = myName + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  localStorage.setItem("chatDeviceId", myDeviceId);
}

const chatRef = db.ref("messages");
const typingRef = db.ref("typing/" + myName);
const presenceRef = db.ref("presence/" + myName);
const pinnedRef = db.ref("pinnedMessages");
const favoritesRef = db.ref("favoriteMessages");
const scheduledRef = db.ref("scheduledMessages");
const streakRef = db.ref("streakData");
const loveMeterRef = db.ref("loveMeter");

let lastReadMsgKey = localStorage.getItem("chatLastRead") || "";
let chatSoundEnabled = localStorage.getItem("chatSound") !== "off";
let myMsgKeys = new Set();
let allReactions = {};
let allPinned = {};
let allFavorites = {};
let allMessages = {};
// dashboard / NK.store / analyst window.allMessages padhte hain — isliye
// same object ko window par bhi expose karte hain (pehle stats hamesha 0 aate the)
window.allMessages = allMessages;

// ─── PREMIUM STATE ────────────────────────────────────────
let currentTheme = localStorage.getItem("chatTheme") || "default";
let chatPinLocked = false;
let chatPinCode = localStorage.getItem("chatPinCode") || "";
let editingMsgKey = null;
let replyingTo = null;
let gifPickerOpen = false;
let stickerPickerOpen = false;
let searchOpen = false;
let statsOpen = false;
let calendarOpen = false;
let scheduleOpen = false;
let voiceRecording = false;
let mediaRecorder = null;
let voiceChunks = [];
let voiceTimer = null;
let voiceSeconds = 0;

// ─── STREAK TRACKING ──────────────────────────────────────
let streakData = { days: 0, lastDate: "", started: "" };

function updateStreak() {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  if (streakData.lastDate === today) return;
  
  if (streakData.lastDate === yesterday) {
    streakData.days++;
  } else if (streakData.lastDate !== today) {
    streakData.days = 1;
    streakData.started = today;
  }
  streakData.lastDate = today;
  streakRef.set(streakData);
  updateStreakUI();
}

function updateStreakUI() {
  const el = document.getElementById("chat-streak-display");
  if (el) {
    el.innerHTML = `<span class="streak-fire">🔥</span> Day ${streakData.days}`;
  }
}

streakRef.on("value", (snap) => {
  const d = snap.val();
  if (d) {
    streakData = d;
    updateStreakUI();
  }
});

// ─── LOVE METER ───────────────────────────────────────────
let loveMeterValue = 97;

function updateLoveMeterUI() {
  const el = document.getElementById("chat-love-meter");
  if (el) {
    el.querySelector(".love-meter-fill").style.width = loveMeterValue + "%";
    el.querySelector(".love-meter-pct").textContent = loveMeterValue + "%";
  }
}

// ─── CHAT THEMES ──────────────────────────────────────────
const CHAT_THEMES = {
  default: { name: "Default", bg: "linear-gradient(135deg, rgba(255,77,141,0.2), rgba(155,92,255,0.2))", msgMe: "linear-gradient(135deg, #ff4d8d, #d946ef)", msgThem: "rgba(255,255,255,0.1)" },
  sakura: { name: "Sakura 🌸", bg: "linear-gradient(135deg, #fce4ec, #f8bbd0)", msgMe: "linear-gradient(135deg, #ec407a, #f48fb1)", msgThem: "rgba(236,64,122,0.15)" },
  galaxy: { name: "Galaxy 🌌", bg: "linear-gradient(135deg, #0d0221, #1a0533, #2d1b69)", msgMe: "linear-gradient(135deg, #7c4dff, #448aff)", msgThem: "rgba(124,77,255,0.15)" },
  neon: { name: "Neon 💚", bg: "linear-gradient(135deg, #0a0a0a, #1a1a2e)", msgMe: "linear-gradient(135deg, #00ff88, #00cc6a)", msgThem: "rgba(0,255,136,0.1)" },
  glass: { name: "Glass 🪟", bg: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))", msgMe: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.15))", msgThem: "rgba(255,255,255,0.08)" },
  dark: { name: "Dark 🖤", bg: "linear-gradient(135deg, #1a1a1a, #2d2d2d)", msgMe: "linear-gradient(135deg, #424242, #616161)", msgThem: "rgba(255,255,255,0.05)" },
  pink: { name: "Cute Pink 💗", bg: "linear-gradient(135deg, #ff9a9e, #fecfef)", msgMe: "linear-gradient(135deg, #ff6b9d, #c44569)", msgThem: "rgba(255,107,157,0.15)" },
  love: { name: "Love Theme ❤️", bg: "linear-gradient(135deg, #ee0979, #ff6a00)", msgMe: "linear-gradient(135deg, #ff0844, #ffb199)", msgThem: "rgba(255,8,68,0.15)" }
};

function applyChatTheme(themeKey) {
  const theme = CHAT_THEMES[themeKey] || CHAT_THEMES.default;
  currentTheme = themeKey;
  localStorage.setItem("chatTheme", themeKey);
  
  const chatBox = document.getElementById("chat-box");
  if (!chatBox) return;
  
  chatBox.style.setProperty("--chat-header-bg", theme.bg);
  chatBox.style.setProperty("--chat-msg-me", theme.msgMe);
  chatBox.style.setProperty("--chat-msg-them", theme.msgThem);
  chatBox.dataset.theme = themeKey;
  
  // Re-render messages
  renderAllMessages();
}

// ─── AUTO DAY/NIGHT THEME ─────────────────────────────────
function autoDayNightTheme() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 18) {
    // Daytime - light themes
    if (currentTheme === "default") applyChatTheme("sakura");
  } else {
    // Nighttime - dark themes
    if (currentTheme === "default") applyChatTheme("galaxy");
  }
}

// ─── PRESENCE HEARTBEAT ───────────────────────────────────
presenceRef.set({ online: true, lastSeen: Date.now(), name: myName });
presenceRef.onDisconnect().set({ online: false, lastSeen: Date.now(), name: myName });

setInterval(() => {
  presenceRef.update({ online: true, lastSeen: Date.now() });
}, 30000);

typingRef.onDisconnect().set(false);

// ─── CHAT SOUND (Web Audio) ──────────────────────────────
let audioCtx = null;

function playMsgSound() {
  if (!chatSoundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {}
}

function playSendSound() {
  if (!chatSoundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) {}
}

// ─── TOGGLE CHAT BOX ─────────────────────────────────────
function toggleChat() {
  const box = document.getElementById("chat-box");
  if (!box) return;

  const willOpen = !box.classList.contains("open");

  // PIN Lock Check (har open par, jab tak is session me unlock na kiya ho)
  if (willOpen && chatPinCode && !chatPinLocked) {
    showPinLock();
    return;
  }

  box.classList.toggle("open", willOpen);

  if (!willOpen) {
    // band hone par session unlock reset → agli baar PIN lagega
    chatPinLocked = false;
    gifPickerOpen = false;
    stickerPickerOpen = false;
    emojiPickerOpen = false;
    const gif = document.getElementById("chat-gif-picker");
    if (gif) gif.classList.remove("open");
    const stk = document.getElementById("chat-sticker-picker");
    if (stk) stk.classList.remove("open");
    const emo = document.getElementById("chat-emoji-picker");
    if (emo) emo.classList.remove("open");
    hideReplyBar();
    return;
  }

  const input = document.getElementById("chat-input");
  if (input) setTimeout(() => input.focus(), 200);

  const messagesDiv = document.getElementById("chat-messages");
  if (messagesDiv) {
    requestAnimationFrame(() => { messagesDiv.scrollTop = messagesDiv.scrollHeight; });
  }

  markAllAsRead();
  showNotifBadge(0);
  updateStreak();

  if (typeof ChatNotifications !== "undefined" && ChatNotifications.clearAllNotifications) {
    ChatNotifications.clearAllNotifications();
  }
}

// ─── PIN LOCK ─────────────────────────────────────────────
function showPinLock() {
  let overlay = document.getElementById("chat-pin-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "chat-pin-overlay";
    overlay.className = "chat-pin-overlay";
    overlay.innerHTML = `
      <div class="chat-pin-card">
        <span class="chat-pin-icon">🔒</span>
        <h3>Enter PIN</h3>
        <input type="password" id="chat-pin-input" maxlength="6" placeholder="Enter PIN..." />
        <div class="chat-pin-btns">
          <button onclick="checkChatPin()">Unlock</button>
          <button onclick="closePinLock()">Cancel</button>
        </div>
        <p class="chat-pin-error" id="chat-pin-error"></p>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.classList.add("open");
  setTimeout(() => {
    const inp = document.getElementById("chat-pin-input");
    if (inp) inp.focus();
  }, 200);
}

function checkChatPin() {
  const inp = document.getElementById("chat-pin-input");
  const err = document.getElementById("chat-pin-error");
  if (!inp) return;
  if (inp.value === chatPinCode) {
    chatPinLocked = true;
    closePinLock();
    // Now actually open chat
    const box = document.getElementById("chat-box");
    if (box) {
      box.classList.add("open");
      const input = document.getElementById("chat-input");
      if (input) setTimeout(() => input.focus(), 200);
      markAllAsRead();
    }
  } else {
    if (err) err.textContent = "Wrong PIN! 💔";
    inp.value = "";
    inp.classList.add("shake");
    setTimeout(() => inp.classList.remove("shake"), 500);
  }
}

function closePinLock() {
  const overlay = document.getElementById("chat-pin-overlay");
  if (overlay) overlay.classList.remove("open");
}

function setChatPin() {
  const pin = prompt("Set a 4-6 digit PIN for chat lock:");
  if (pin && pin.length >= 4 && pin.length <= 6) {
    chatPinCode = pin;
    localStorage.setItem("chatPinCode", pin);
    showPremiumToast("PIN Lock set! 🔒");
  }
}

function removeChatPin() {
  chatPinCode = "";
  chatPinLocked = false;
  localStorage.removeItem("chatPinCode");
  showPremiumToast("PIN Lock removed 🔓");
}

// ─── MARK ALL AS READ ────────────────────────────────────
function markAllAsRead() {
  const keys = Object.keys(allMessages || {});

  if (!keys.length) {
    chatRef.limitToLast(1).once("value", (snap) => {
      const data = snap.val();
      if (!data) return;
      const lastKey = Object.keys(data).pop();
      lastReadMsgKey = lastKey;
      localStorage.setItem("chatLastRead", lastReadMsgKey);
    }).catch(() => {});
    return;
  }

  const sorted = keys.sort();
  lastReadMsgKey = sorted[sorted.length - 1] || lastReadMsgKey;
  localStorage.setItem("chatLastRead", lastReadMsgKey);

  sorted.forEach((key) => {
    const msg = allMessages[key];
    if (msg && msg.sender !== myName && !msg.read) pendingReadKeys.add(key);
  });
  scheduleReadFlush();
  showNotifBadge(0);
}

// ─── SEND MESSAGE ────────────────────────────────────────
function sendMessage() {
  const input = document.getElementById("chat-input");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  typingRef.set(false);

  // Edit mode
  if (editingMsgKey) {
    chatRef.child(editingMsgKey).update({
      text: text.slice(0, 500),
      edited: true,
      editedAt: Date.now()
    });
    editingMsgKey = null;
    hideEditBar();
    input.value = "";
    playSendSound();
    return;
  }

  const msgData = {
    text: text.slice(0, 500),
    sender: myName,
    timestamp: Date.now(),
    deviceId: myDeviceId,
    read: false
  };

  // Reply reference
  if (replyingTo) {
    msgData.replyTo = replyingTo.key;
    msgData.replyText = replyingTo.text;
    msgData.replySender = replyingTo.sender;
    replyingTo = null;
    hideReplyBar();
  }

  chatRef.push(msgData);
  input.value = "";
  if (emojiPickerOpen) toggleEmojiPicker();
  playSendSound();

  // Love Rain trigger
  const lower = text.toLowerCase();
  if (lower.includes("i love you") || lower.includes("love you") || lower.includes("i love u") ||
      lower.includes("miss you") || lower.includes("love u") || lower.includes("ily") ||
      lower.includes("❤️❤️❤️") || lower.includes("💕💕💕")) {
    triggerLoveRain();
    triggerMessageAnimation("hearts");
  }

  // AI Auto Reply check
  checkAIAutoReply(text);
}

// ─── SEND SPECIAL MESSAGE TYPES ───────────────────────────
function sendSecretMessage() {
  const text = prompt("Type your secret message:");
  if (!text || !text.trim()) return;
  
  chatRef.push({
    text: text.slice(0, 500),
    sender: myName,
    timestamp: Date.now(),
    deviceId: myDeviceId,
    read: false,
    secret: true,
    revealed: false
  });
  playSendSound();
  showPremiumToast("Secret message sent! 🤫");
}

function sendSelfDestructMessage() {
  const text = prompt("Type message (will self-destruct):");
  if (!text || !text.trim()) return;
  
  const durations = [5, 30, 60];
  const choice = prompt("Delete after: 1) 5 sec  2) 30 sec  3) 1 min\nEnter 1, 2, or 3:");
  const dur = durations[parseInt(choice) - 1] || 30;
  
  chatRef.push({
    text: text.slice(0, 500),
    sender: myName,
    timestamp: Date.now(),
    deviceId: myDeviceId,
    read: false,
    selfDestruct: true,
    destructAfter: dur
  });
  playSendSound();
  showPremiumToast(`Self-destruct in ${dur}s! 💣`);
}

function sendScheduledMessage() {
  const text = prompt("Type your scheduled message:");
  if (!text || !text.trim()) return;
  
  const timeStr = prompt("Schedule time (e.g., '2026-08-06 00:00' for tomorrow midnight):");
  if (!timeStr) return;
  
  const scheduledTime = new Date(timeStr).getTime();
  if (isNaN(scheduledTime) || scheduledTime < Date.now()) {
    showPremiumToast("Invalid or past time! ⏰");
    return;
  }
  
  scheduledRef.push({
    text: text.slice(0, 500),
    sender: myName,
    scheduledTime: scheduledTime,
    createdAt: Date.now(),
    sent: false
  });
  showPremiumToast("Message scheduled! 📅");
}

// Check and send scheduled messages
setInterval(() => {
  scheduledRef.orderByChild("sent").equalTo(false).once("value", (snap) => {
    const data = snap.val();
    if (!data) return;
    Object.entries(data).forEach(([key, msg]) => {
      if (msg.scheduledTime <= Date.now()) {
        chatRef.push({
          text: msg.text,
          sender: msg.sender,
          timestamp: Date.now(),
          deviceId: myDeviceId,
          read: false,
          scheduled: true
        });
        scheduledRef.child(key).update({ sent: true });
      }
    });
  });
}, 30000);

// ─── REPLY TO MESSAGE ────────────────────────────────────
function replyToMessage(key, text, sender) {
  replyingTo = { key, text, sender };
  showReplyBar(sender, text);
  const input = document.getElementById("chat-input");
  if (input) input.focus();
}

function showReplyBar(sender, text) {
  let bar = document.getElementById("chat-reply-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "chat-reply-bar";
    bar.className = "chat-reply-bar";
    const inputRow = document.querySelector(".chat-input-row");
    if (inputRow) inputRow.parentElement.insertBefore(bar, inputRow);
  }
  bar.innerHTML = `
    <div class="reply-preview">
      <div class="reply-preview-line"></div>
      <div class="reply-preview-content">
        <span class="reply-preview-name">${escapeHtml(sender)}</span>
        <span class="reply-preview-text">${escapeHtml(text.substring(0, 50))}</span>
      </div>
    </div>
    <button class="reply-cancel" onclick="hideReplyBar()">✕</button>
  `;
  bar.style.display = "flex";
}

function hideReplyBar() {
  replyingTo = null;
  const bar = document.getElementById("chat-reply-bar");
  if (bar) bar.style.display = "none";
}

// ─── EDIT MESSAGE ────────────────────────────────────────
function editMessage(key, text) {
  editingMsgKey = key;
  const input = document.getElementById("chat-input");
  if (input) {
    input.value = text;
    input.focus();
  }
  showEditBar(text);
}

function showEditBar(text) {
  let bar = document.getElementById("chat-edit-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "chat-edit-bar";
    bar.className = "chat-edit-bar";
    const inputRow = document.querySelector(".chat-input-row");
    if (inputRow) inputRow.parentElement.insertBefore(bar, inputRow);
  }
  bar.innerHTML = `
    <span class="edit-icon">✏️</span>
    <span class="edit-label">Editing message</span>
    <button class="edit-cancel" onclick="cancelEdit()">✕</button>
  `;
  bar.style.display = "flex";
}

function hideEditBar() {
  const bar = document.getElementById("chat-edit-bar");
  if (bar) bar.style.display = "none";
}

function cancelEdit() {
  editingMsgKey = null;
  const input = document.getElementById("chat-input");
  if (input) input.value = "";
  hideEditBar();
}

// ─── PIN MESSAGE ──────────────────────────────────────────
function pinMessage(key) {
  if (allPinned[key]) {
    pinnedRef.child(key).remove();
    showPremiumToast("Message unpinned 📌");
  } else {
    pinnedRef.child(key).set({
      pinnedBy: myName,
      timestamp: Date.now()
    });
    showPremiumToast("Message pinned! 📌");
  }
}

pinnedRef.on("value", (snap) => {
  allPinned = snap.val() || {};
  updatePinnedBar();
});

function updatePinnedBar() {
  let bar = document.getElementById("chat-pinned-bar");
  const keys = Object.keys(allPinned);
  
  if (keys.length === 0) {
    if (bar) bar.style.display = "none";
    return;
  }
  
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "chat-pinned-bar";
    bar.className = "chat-pinned-bar";
    const msgs = document.getElementById("chat-messages");
    if (msgs && msgs.parentElement) {
      msgs.parentElement.insertBefore(bar, msgs);
    }
  }
  
  // Show latest pinned message
  const latestKey = keys[keys.length - 1];
  const msg = allMessages[latestKey];
  if (msg) {
    bar.innerHTML = `
      <span class="pinned-icon">📌</span>
      <span class="pinned-text">${escapeHtml((msg.text || "").substring(0, 40))}</span>
      <button class="pinned-close" onclick="document.getElementById('chat-pinned-bar').style.display='none'">✕</button>
    `;
    bar.style.display = "flex";
  }
}

// ─── FAVORITE MESSAGE ─────────────────────────────────────
function favoriteMessage(key) {
  if (allFavorites[key]) {
    favoritesRef.child(key).remove();
    showPremiumToast("Removed from favorites");
  } else {
    favoritesRef.child(key).set({
      favoritedBy: myName,
      timestamp: Date.now()
    });
    showPremiumToast("Added to favorites! ⭐");
  }
}

favoritesRef.on("value", (snap) => {
  allFavorites = snap.val() || {};
});

// ─── SEARCH MESSAGES ──────────────────────────────────────
function toggleSearch() {
  searchOpen = !searchOpen;
  let panel = document.getElementById("chat-search-panel");
  
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "chat-search-panel";
    panel.className = "chat-search-panel";
    panel.innerHTML = `
      <div class="search-input-row">
        <input type="text" id="chat-search-input" placeholder="Search messages..." oninput="searchMessages(this.value)" />
        <button onclick="toggleSearch()">✕</button>
      </div>
      <div class="search-results" id="chat-search-results"></div>
    `;
    const header = document.querySelector(".chat-header");
    if (header) header.after(panel);
  }
  
  panel.classList.toggle("open", searchOpen);
  if (searchOpen) {
    setTimeout(() => {
      const inp = document.getElementById("chat-search-input");
      if (inp) inp.focus();
    }, 200);
  }
}

function searchMessages(query) {
  const results = document.getElementById("chat-search-results");
  if (!results) return;
  
  if (!query || query.length < 2) {
    results.innerHTML = "";
    return;
  }
  
  const q = query.toLowerCase();
  const found = Object.entries(allMessages).filter(([key, msg]) => {
    return msg.text && msg.text.toLowerCase().includes(q);
  }).slice(-10);
  
  if (found.length === 0) {
    results.innerHTML = '<div class="search-empty">No messages found</div>';
    return;
  }
  
  results.innerHTML = found.map(([key, msg]) => `
    <div class="search-result-item" onclick="scrollToMessage('${key}')">
      <span class="search-result-sender">${escapeHtml(msg.sender || "")}</span>
      <span class="search-result-text">${highlightSearch(msg.text, query)}</span>
    </div>
  `).join("");
}

function highlightSearch(text, query) {
  if (!text) return "";
  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<mark>$1</mark>');
}

function scrollToMessage(key) {
  const el = document.querySelector(`.msg[data-key="${key}"]`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("msg-highlight");
    setTimeout(() => el.classList.remove("msg-highlight"), 2000);
  }
  toggleSearch();
}

// ─── CHAT STATISTICS ──────────────────────────────────────
async function toggleStats() {
  statsOpen = !statsOpen;
  let panel = document.getElementById("chat-stats-panel");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "chat-stats-panel";
    panel.className = "chat-stats-panel";
    document.body.appendChild(panel);
  }

  if (statsOpen) {
    let data = { empty: true, total: 0, topSender: null, linkCount: 0, chatDays: 0 };
    try {
      data = await window.NK.dashboard.compute(true);
    } catch (error) {
      console.error("Dashboard stats failed:", error);
    }

    const msgs = Object.values(allMessages || {});
    const totalMsgs = data.total || msgs.length;
    const photos = data.photos || msgs.filter((m) => m.type === "image").length;
    const videos = data.videos || msgs.filter((m) => m.type === "video").length;
    const voice = data.voice || msgs.filter((m) => m.type === "voice").length;

    const emojiCount = {};
    const emojiRegex = /(?:[\u2700-\u27BF]|[\u{1F300}-\u{1FAFF}]|[\u2600-\u26FF])/gu;
    msgs.forEach((m) => {
      if (m.text) {
        const emojis = m.text.match(emojiRegex) || [];
        emojis.forEach((e) => {
          emojiCount[e] = (emojiCount[e] || 0) + 1;
        });
      }
    });

    const topEmoji = Object.entries(emojiCount).sort((a, b) => b[1] - a[1])[0];
    const topSenderName = data.topSender ? data.topSender.name : "—";
    const topSenderCount = data.topSender ? data.topSender.count : 0;
    const topDay = data.topDay ? data.topDay.day : "—";
    const longestStreak = streakData.days || 0;

    panel.innerHTML = `
      <div class="chat-stats-card">
        <div class="stats-header">
          <h3>📊 Relationship Stats</h3>
          <button onclick="toggleStats()">✕</button>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-num">${totalMsgs.toLocaleString()}</span>
            <span class="stat-label">Messages</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">${photos}</span>
            <span class="stat-label">Photos</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">${videos}</span>
            <span class="stat-label">Videos</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">${voice}</span>
            <span class="stat-label">Voice Notes</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">${topEmoji ? topEmoji[0] : "❤️"}</span>
            <span class="stat-label">Top Emoji</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">🔥 ${longestStreak}</span>
            <span class="stat-label">Day Streak</span>
          </div>
        </div>

        <div class="relationship-breakdown">
          <div class="mini-metric">
            <span>Top sender</span>
            <strong>${escapeHtml(topSenderName)}</strong>
          </div>
          <div class="mini-metric">
            <span>Most active day</span>
            <strong>${escapeHtml(topDay)}</strong>
          </div>
          <div class="mini-metric">
            <span>Chat days</span>
            <strong>${data.chatDays || 0}</strong>
          </div>
          <div class="mini-metric">
            <span>Shared links</span>
            <strong>${data.linkCount || 0}</strong>
          </div>
        </div>

        <div class="stats-love-meter">
          <h4>💖 Love Meter</h4>
          <div class="love-meter-bar">
            <div class="love-meter-fill" style="width: ${loveMeterValue}%"></div>
          </div>
          <span class="love-meter-pct">${loveMeterValue}% Compatible</span>
        </div>
      </div>
    `;
    panel.classList.add("open");
  } else {
    panel.classList.remove("open");
  }
}

// ─── CHAT CALENDAR ────────────────────────────────────────
function toggleCalendar() {
  calendarOpen = !calendarOpen;
  let panel = document.getElementById("chat-calendar-panel");
  
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "chat-calendar-panel";
    panel.className = "chat-calendar-panel";
    document.body.appendChild(panel);
  }
  
  if (calendarOpen) {
    panel.innerHTML = `
      <div class="chat-calendar-card">
        <div class="calendar-header">
          <h3>📅 Chat Calendar</h3>
          <button onclick="toggleCalendar()">✕</button>
        </div>
        <input type="date" id="chat-calendar-date" onchange="loadCalendarDate(this.value)" />
        <div class="calendar-results" id="chat-calendar-results">
          <p class="calendar-hint">Select a date to see all messages from that day</p>
        </div>
      </div>
    `;
    panel.classList.add("open");
  } else {
    panel.classList.remove("open");
  }
}

function loadCalendarDate(dateStr) {
  const results = document.getElementById("chat-calendar-results");
  if (!results || !dateStr) return;

  const selected = dateStr.length === 10 ? new Date(dateStr + "T00:00:00") : new Date(dateStr);
  if (isNaN(selected.getTime())) {
    results.innerHTML = '<p class="calendar-empty">Invalid date</p>';
    return;
  }

  const dayStart = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()).getTime();
  const nextDay = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + 1).getTime();

  const dayMsgs = Object.entries(allMessages)
    .filter(([, msg]) => {
      const ts = Number(msg.timestamp) || 0;
      return ts >= dayStart && ts < nextDay;
    })
    .sort((a, b) => (Number(a[1].timestamp) || 0) - (Number(b[1].timestamp) || 0));

  if (dayMsgs.length === 0) {
    results.innerHTML = '<p class="calendar-empty">No messages on this day</p>';
    return;
  }

  const heading = document.createElement("p");
  heading.className = "calendar-count";
  heading.textContent = dayMsgs.length + " messages on " + selected.toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  results.innerHTML = "";
  results.appendChild(heading);

  dayMsgs.forEach(([, msg]) => {
    const row = document.createElement("div");
    row.className = "calendar-msg";

    const sender = document.createElement("span");
    sender.className = "cal-msg-sender";
    sender.textContent = msg.sender || "";

    const text = document.createElement("span");
    text.className = "cal-msg-text";
    text.textContent = msg.text || mediaLabel(msg);

    const time = document.createElement("span");
    time.className = "cal-msg-time";
    time.textContent = formatChatTime(msg.timestamp);

    row.appendChild(sender);
    row.appendChild(text);
    row.appendChild(time);
    results.appendChild(row);
  });
}

// ─── IMAGE SHARING ────────────────────────────────────────
function sendImage() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      showPremiumToast("Image too large! Max 5MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      chatRef.push({
        type: "image",
        imageUrl: base64,
        sender: myName,
        timestamp: Date.now(),
        deviceId: myDeviceId,
        read: false
      });
      playSendSound();
      showPremiumToast("Image sent! 📸");
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// ─── VIDEO SHARING ────────────────────────────────────────
function sendVideo() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "video/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      showPremiumToast("Video too large! Max 10MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      chatRef.push({
        type: "video",
        videoUrl: ev.target.result,
        sender: myName,
        timestamp: Date.now(),
        deviceId: myDeviceId,
        read: false
      });
      playSendSound();
      showPremiumToast("Video sent! 🎥");
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// ─── VOICE MESSAGE ────────────────────────────────────────
let voiceDiscard = false;
let voiceStream = null;
let voiceStartedAt = 0;

function toggleVoiceRecord() {
  if (voiceRecording) stopVoiceRecord();
  else startVoiceRecord();
}

function startVoiceRecord() {
  if (voiceRecording) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showPremiumToast("Microphone not available!");
    return;
  }

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    voiceStream = stream;
    voiceRecording = true;
    voiceDiscard = false;
    voiceChunks = [];
    voiceSeconds = 0;
    voiceStartedAt = Date.now();

    try {
      mediaRecorder = new MediaRecorder(stream);
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      voiceStream = null;
      voiceRecording = false;
      showPremiumToast("Recording not supported here!");
      return;
    }

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) voiceChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      if (voiceStream) {
        voiceStream.getTracks().forEach((t) => t.stop());
        voiceStream = null;
      }

      // Cancel kiya → kuch send mat karo (purana bug)
      if (voiceDiscard) {
        voiceChunks = [];
        return;
      }

      if (!voiceChunks.length || Date.now() - voiceStartedAt < 500) {
        voiceChunks = [];
        showPremiumToast("Recording is too short 🙈");
        return;
      }

      const mime = (voiceChunks[0] && voiceChunks[0].type) || "audio/webm";
      const blob = new Blob(voiceChunks, { type: mime });
      voiceChunks = [];

      const reader = new FileReader();
      reader.onload = (ev) => {
        chatRef.push({
          type: "voice",
          voiceUrl: ev.target.result,
          duration: voiceSeconds,
          sender: myName,
          timestamp: Date.now(),
          deviceId: myDeviceId,
          read: false
        });
        playSendSound();
        showPremiumToast("Voice message sent! 🎤");
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();

    if (voiceTimer) clearInterval(voiceTimer);
    voiceTimer = setInterval(() => {
      voiceSeconds++;
      updateVoiceRecordUI();
    }, 1000);

    updateVoiceRecordUI();
  }).catch(() => {
    showPremiumToast("Mic permission denied!");
  });
}

function stopVoiceRecord() {
  voiceRecording = false;
  voiceDiscard = false;
  if (voiceTimer) {
    clearInterval(voiceTimer);
    voiceTimer = null;
  }
  if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
  hideVoiceRecordUI();
}

function cancelVoiceRecord() {
  voiceRecording = false;
  voiceDiscard = true;            // onstop ko batao: discard karo
  if (voiceTimer) {
    clearInterval(voiceTimer);
    voiceTimer = null;
  }
  if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
  hideVoiceRecordUI();
}

function updateVoiceRecordUI() {
  let bar = document.getElementById("chat-voice-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "chat-voice-bar";
    bar.className = "chat-voice-bar";
    const inputRow = document.querySelector(".chat-input-row");
    if (inputRow) inputRow.parentElement.insertBefore(bar, inputRow);
  }
  const mins = Math.floor(voiceSeconds / 60);
  const secs = voiceSeconds % 60;
  bar.innerHTML = `
    <div class="voice-rec-indicator">
      <span class="voice-rec-dot"></span>
      <span class="voice-rec-time">${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}</span>
      <span class="voice-rec-waves">〰️</span>
    </div>
    <div class="voice-rec-actions">
      <button class="voice-cancel-btn" onclick="cancelVoiceRecord()">🗑️</button>
      <button class="voice-stop-btn" onclick="stopVoiceRecord()">⏹️ Send</button>
    </div>
  `;
  bar.style.display = "flex";
}

function hideVoiceRecordUI() {
  const bar = document.getElementById("chat-voice-bar");
  if (bar) bar.style.display = "none";
}

// ─── FILE SHARING ─────────────────────────────────────────
function sendFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".pdf,.doc,.docx,.zip,.apk,.txt,.xls,.xlsx,.ppt,.pptx";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      showPremiumToast("File too large! Max 10MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      chatRef.push({
        type: "file",
        fileUrl: ev.target.result,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        sender: myName,
        timestamp: Date.now(),
        deviceId: myDeviceId,
        read: false
      });
      playSendSound();
      showPremiumToast("File sent! 📄");
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// ─── STICKER PACK ─────────────────────────────────────────
const STICKER_PACK = [
  "🥰", "😘", "🤗", "💕", "💖", "💗", "❤️", "💝",
  "🌹", "🦋", "✨", "💫", "🌸", "🌺", "🌷", "💐",
  "🐱", "🐶", "🐰", "🦊", "🐻", "🐼", "🐨", "🦁",
  "😍", "🥺", "😢", "🙈", "💪", "👑", "🎉", "🎊",
  "☕", "🍕", "🍰", "🧁", "🍫", "🍩", "🎂", "🍪"
];

function toggleStickerPicker() {
  stickerPickerOpen = !stickerPickerOpen;
  let picker = document.getElementById("chat-sticker-picker");
  
  if (!picker) {
    picker = document.createElement("div");
    picker.id = "chat-sticker-picker";
    picker.className = "chat-sticker-picker";
    
    const grid = document.createElement("div");
    grid.className = "sticker-grid";
    
    STICKER_PACK.forEach(sticker => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sticker-btn";
      btn.textContent = sticker;
      btn.addEventListener("click", () => {
        sendSticker(sticker);
      });
      grid.appendChild(btn);
    });
    
    picker.appendChild(grid);
    const inputRow = document.querySelector(".chat-input-row");
    if (inputRow) inputRow.parentElement.insertBefore(picker, inputRow);
  }
  
  picker.classList.toggle("open", stickerPickerOpen);
}

function sendSticker(sticker) {
  chatRef.push({
    type: "sticker",
    sticker: sticker,
    sender: myName,
    timestamp: Date.now(),
    deviceId: myDeviceId,
    read: false
  });
  playSendSound();
  if (stickerPickerOpen) toggleStickerPicker();
}

// ─── GIF SEARCH (KLIPY API) ──────────────────────────────
// 🔑 PASTE YOUR KLIPY API KEY BELOW (get it from https://partner.klipy.com/api-keys)
const KLIPY_API_KEY = "FsTUSFpgCVoWOk3yQo7HIHCvTe0UXx55To9hyZLFUAmgphfQaXpyhPFSEUTU8bN8";
const KLIPY_BASE_URL = "https://api.klipy.com/api/v1";
let klipyCurrentPage = 1;
let klipyCurrentQuery = "";
let klipyHasNext = false;

function toggleGifPicker() {
  gifPickerOpen = !gifPickerOpen;
  let picker = document.getElementById("chat-gif-picker");
  
  if (!picker) {
    picker = document.createElement("div");
    picker.id = "chat-gif-picker";
    picker.className = "chat-gif-picker";
    picker.innerHTML = `
      <div class="gif-search-row">
        <input type="text" id="gif-search-input" placeholder="Search GIFs on Klipy..." onkeydown="if(event.key==='Enter') searchKlipyGifs(this.value)" />
        <button onclick="searchKlipyGifs(document.getElementById('gif-search-input').value)">🔍</button>
      </div>
      <div class="gif-results" id="gif-results">
        <p class="gif-hint">🎭 Powered by Klipy — Search love, cute, happy GIFs...</p>
      </div>
    `;
    const inputRow = document.querySelector(".chat-input-row");
    if (inputRow) inputRow.parentElement.insertBefore(picker, inputRow);
  }
  
  picker.classList.toggle("open", gifPickerOpen);
  if (gifPickerOpen) {
    setTimeout(() => {
      const inp = document.getElementById("gif-search-input");
      if (inp) inp.focus();
    }, 200);
    // Load trending GIFs on open
    loadKlipyTrending();
  }
}


// ─── KLIPY: Load Trending GIFs ────────────────────────────
function loadKlipyTrending() {
  const results = document.getElementById("gif-results");
  if (!results) return;
  if (typeof fetch !== "function") {
    results.innerHTML = '<p class="gif-error">Internet connection chahiye 🌐</p>';
    return;
  }
  
  /*
  if (!KLIPY_API_KEY) {
    results.innerHTML = '<p class="gif-error">⚠️ Klipy API key not set! Add your key in live-chat.js</p>';
    return;
  }
  */
  
  results.innerHTML = '<p class="gif-loading">🔥 Loading trending GIFs...</p>';
  
  const url = `${KLIPY_BASE_URL}/${KLIPY_API_KEY}/gifs/trending?per_page=24&locale=in_IN`;
  
  fetch(url)
    .then(r => r.json())
    .then(response => {
      if (!response.result || !response.data || !response.data.data || response.data.data.length === 0) {
        results.innerHTML = '<p class="gif-empty">No trending GIFs found</p>';
        return;
      }
      
      klipyHasNext = response.data.has_next;
      klipyCurrentPage = response.data.current_page;
      klipyCurrentQuery = "";
      
      renderKlipyGifs(response.data.data, results);
      
      // Add "Load More" button if there are more results
      if (klipyHasNext) {
        const loadMoreBtn = document.createElement("button");
        loadMoreBtn.className = "gif-load-more";
        loadMoreBtn.textContent = "Load More Trending 🔥";
        loadMoreBtn.onclick = () => loadKlipyTrendingMore();
        results.appendChild(loadMoreBtn);
      }
    })
    .catch(err => {
      results.innerHTML = '<p class="gif-error">Could not load GIFs. Check API key or try again!</p>';
      console.error("Klipy trending error:", err);
    });
}

function loadKlipyTrendingMore() {
  const results = document.getElementById("gif-results");
  if (!results) return;
  
  const nextPage = klipyCurrentPage + 1;
  const url = `${KLIPY_BASE_URL}/${KLIPY_API_KEY}/gifs/trending?per_page=24&page=${nextPage}&locale=in_IN`;
  
  // Remove load more button
  const loadMore = results.querySelector(".gif-load-more");
  if (loadMore) loadMore.remove();
  
  fetch(url)
    .then(r => r.json())
    .then(response => {
      if (!response.result || !response.data || !response.data.data) return;
      
      klipyHasNext = response.data.has_next;
      klipyCurrentPage = response.data.current_page;
      
      renderKlipyGifs(response.data.data, results, true);
      
      if (klipyHasNext) {
        const loadMoreBtn = document.createElement("button");
        loadMoreBtn.className = "gif-load-more";
        loadMoreBtn.textContent = "Load More 🔥";
        loadMoreBtn.onclick = () => loadKlipyTrendingMore();
        results.appendChild(loadMoreBtn);
      }
    })
    .catch(err => console.error("Klipy trending more error:", err));
}

// ─── KLIPY: Search GIFs ──────────────────────────────────
function searchKlipyGifs(query) {
  const results = document.getElementById("gif-results");
  if (!results) return;
  if (typeof fetch !== "function") {
    results.innerHTML = '<p class="gif-error">Internet connection chahiye 🌐</p>';
    return;
  }
  
  if (!query || !query.trim()) {
    loadKlipyTrending();
    return;
  }
  
  if (!KLIPY_API_KEY) {
    results.innerHTML = '<p class="gif-error">⚠️ Klipy API key not set! Add your key in live-chat.js</p>';
    return;
  }
  
  results.innerHTML = '<p class="gif-loading">🔍 Searching GIFs...</p>';
  klipyCurrentQuery = query;
  klipyCurrentPage = 1;
  
  const url = `${KLIPY_BASE_URL}/${KLIPY_API_KEY}/gifs/search?q=${encodeURIComponent(query)}&per_page=24&locale=in_IN&rating=g`;
  
  fetch(url)
    .then(r => r.json())
    .then(response => {
      if (!response.result || !response.data || !response.data.data || response.data.data.length === 0) {
        results.innerHTML = '<p class="gif-empty">No GIFs found for "' + escapeHtml(query) + '"</p>';
        return;
      }
      
      klipyHasNext = response.data.has_next;
      klipyCurrentPage = response.data.current_page;
      
      renderKlipyGifs(response.data.data, results);
      
      if (klipyHasNext) {
        const loadMoreBtn = document.createElement("button");
        loadMoreBtn.className = "gif-load-more";
        loadMoreBtn.textContent = "Load More Results 🔍";
        loadMoreBtn.onclick = () => searchKlipyGifsMore();
        results.appendChild(loadMoreBtn);
      }
    })
    .catch(err => {
      results.innerHTML = '<p class="gif-error">Could not search GIFs. Try again!</p>';
      console.error("Klipy search error:", err);
    });
}

function searchKlipyGifsMore() {
  const results = document.getElementById("gif-results");
  if (!results || !klipyCurrentQuery) return;
  
  const nextPage = klipyCurrentPage + 1;
  const url = `${KLIPY_BASE_URL}/${KLIPY_API_KEY}/gifs/search?q=${encodeURIComponent(klipyCurrentQuery)}&per_page=24&page=${nextPage}&locale=in_IN&rating=g`;
  
  const loadMore = results.querySelector(".gif-load-more");
  if (loadMore) loadMore.remove();
  
  fetch(url)
    .then(r => r.json())
    .then(response => {
      if (!response.result || !response.data || !response.data.data) return;
      
      klipyHasNext = response.data.has_next;
      klipyCurrentPage = response.data.current_page;
      
      renderKlipyGifs(response.data.data, results, true);
      
      if (klipyHasNext) {
        const loadMoreBtn = document.createElement("button");
        loadMoreBtn.className = "gif-load-more";
        loadMoreBtn.textContent = "Load More 🔍";
        loadMoreBtn.onclick = () => searchKlipyGifsMore();
        results.appendChild(loadMoreBtn);
      }
    })
    .catch(err => console.error("Klipy search more error:", err));
}

// Keep old function name for backwards compatibility
function searchGifs(query) {
  searchKlipyGifs(query);
}

// ─── KLIPY: Render GIF Grid ──────────────────────────────
function renderKlipyGifs(gifData, container, append = false) {
  if (!append) container.innerHTML = "";

  gifData.forEach((gif) => {
    const files = gif.file || gif.files || {};

    let thumbUrl = "";
    if (files.xs && files.xs.jpg && files.xs.jpg.url) thumbUrl = files.xs.jpg.url;
    else if (files.sm && files.sm.jpg && files.sm.jpg.url) thumbUrl = files.sm.jpg.url;
    else if (files.xs && files.xs.gif && files.xs.gif.url) thumbUrl = files.xs.gif.url;

    let fullUrl = "";
    if (files.hd && files.hd.gif && files.hd.gif.url) fullUrl = files.hd.gif.url;
    else if (files.md && files.md.gif && files.md.gif.url) fullUrl = files.md.gif.url;
    else if (files.gif && files.gif.url) fullUrl = files.gif.url;
    else if (files.sm && files.sm.gif && files.sm.gif.url) fullUrl = files.sm.gif.url;

    if (!thumbUrl && gif.slug) thumbUrl = `https://media.klipy.com/320/${gif.slug}.gif`;
    if (!fullUrl && gif.slug) fullUrl = `https://media.klipy.com/${gif.slug}.gif`;

    if (!thumbUrl) thumbUrl = gif.url || gif.src || "";
    if (!fullUrl) fullUrl = gif.url || gif.src || thumbUrl;

    if (!thumbUrl) return;

    const img = document.createElement("img");
    img.className = "gif-thumb";
    img.src = thumbUrl;
    img.alt = gif.title || "GIF";
    img.loading = "lazy";
    img.title = gif.title || "";
    img.setAttribute("data-full", fullUrl);
    img.setAttribute("data-thumb", thumbUrl);

    img.addEventListener("click", () => sendKlipyGif(fullUrl, thumbUrl));

    container.appendChild(img);
  });
}

// ─── KLIPY: Send GIF ─────────────────────────────────────
function sendKlipyGif(fullUrl, thumbUrl) {
  chatRef.push({
    type: "gif",
    gifUrl: thumbUrl,
    gifOriginal: fullUrl,
    gifProvider: "klipy",
    sender: myName,
    timestamp: Date.now(),
    deviceId: myDeviceId,
    read: false
  });
  playSendSound();
  if (gifPickerOpen) toggleGifPicker();
  showPremiumToast("GIF sent! 🎭");
}

// Keep old function name for backwards compatibility
function sendGif(originalUrl, thumbUrl) {
  sendKlipyGif(originalUrl, thumbUrl);
}

// ─── DOUBLE TAP LIKE ──────────────────────────────────────
let lastTapTime = 0;
let lastTapKey = "";

function handleDoubleTap(key, el) {
  const now = Date.now();
  if (lastTapKey === key && now - lastTapTime < 400) {
    // Double tap!
    reactToMessage(key, "❤️");
    showDoubleTapHeart(el);
    lastTapTime = 0;
    lastTapKey = "";
  } else {
    lastTapTime = now;
    lastTapKey = key;
  }
}

function showDoubleTapHeart(el) {
  const heart = document.createElement("span");
  heart.className = "double-tap-heart";
  heart.textContent = "❤️";
  heart.style.position = "absolute";
  heart.style.top = "50%";
  heart.style.left = "50%";
  heart.style.transform = "translate(-50%, -50%) scale(0)";
  heart.style.fontSize = "2.5rem";
  heart.style.pointerEvents = "none";
  heart.style.zIndex = "100";
  heart.style.animation = "doubleTapHeart 0.8s ease-out forwards";
  
  el.style.position = "relative";
  el.appendChild(heart);
  setTimeout(() => heart.remove(), 900);
}

// ─── MESSAGE ANIMATIONS ───────────────────────────────────
function triggerMessageAnimation(type) {
  const container = document.getElementById("chat-messages");
  if (!container) return;
  
  const animations = {
    confetti: () => spawnConfettiInChat(container),
    fireworks: () => spawnFireworksInChat(container),
    hearts: () => { /* already handled by love rain */ },
    snow: () => spawnSnowInChat(container),
    balloons: () => spawnBalloonsInChat(container)
  };
  
  if (animations[type]) animations[type]();
}

function spawnConfettiInChat(container) {
  const colors = ["#ff4d8d", "#9b5cff", "#ffd6a0", "#4ade80", "#60a5fa", "#fbbf24"];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("span");
    p.className = "chat-confetti";
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.setProperty("--cd", 1.5 + Math.random() * 1.5 + "s");
    p.style.animationDelay = Math.random() * 0.5 + "s";
    p.style.width = 6 + Math.random() * 6 + "px";
    p.style.height = 6 + Math.random() * 6 + "px";
    container.appendChild(p);
    setTimeout(() => p.remove(), 3500);
  }
}

function spawnFireworksInChat(container) {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const fw = document.createElement("span");
      fw.className = "chat-firework";
      fw.style.left = 20 + Math.random() * 60 + "%";
      fw.style.top = 20 + Math.random() * 60 + "%";
      fw.textContent = "✨";
      fw.style.fontSize = "2rem";
      container.appendChild(fw);
      setTimeout(() => fw.remove(), 1500);
    }, i * 200);
  }
}

function spawnSnowInChat(container) {
  for (let i = 0; i < 20; i++) {
    const s = document.createElement("span");
    s.className = "chat-snow";
    s.textContent = "❄️";
    s.style.left = Math.random() * 100 + "%";
    s.style.setProperty("--sd", 2 + Math.random() * 2 + "s");
    s.style.animationDelay = Math.random() * 1 + "s";
    s.style.fontSize = 8 + Math.random() * 12 + "px";
    container.appendChild(s);
    setTimeout(() => s.remove(), 4500);
  }
}

function spawnBalloonsInChat(container) {
  const balloons = ["🎈", "🎈", "🎈", "💜", "💗", "🎈"];
  for (let i = 0; i < 10; i++) {
    const b = document.createElement("span");
    b.className = "chat-balloon";
    b.textContent = balloons[Math.floor(Math.random() * balloons.length)];
    b.style.left = Math.random() * 100 + "%";
    b.style.setProperty("--bd", 2 + Math.random() * 2 + "s");
    b.style.animationDelay = Math.random() * 0.8 + "s";
    b.style.fontSize = 20 + Math.random() * 14 + "px";
    container.appendChild(b);
    setTimeout(() => b.remove(), 4500);
  }
}

// ─── AI AUTO REPLY ────────────────────────────────────────
const AI_REPLIES = {
  sad: ["Don't worry ❤️ I'm always with you.", "Everything will be okay, my love 💕", "I'm here for you always 🤗"],
  happy: ["Your happiness makes me happy! 🥰", "Yay! Let's celebrate! 🎉", "Love seeing you happy! 💕"],
  angry: ["Take a deep breath, my love 🌸", "I understand. Want to talk about it? 💕", "I'm here whenever you need me 🤗"],
  love: ["I love you too! ❤️❤️❤️", "You're my everything 💕", "Forever and always, my love 🌹"],
  miss: ["I miss you too! 🥺💕", "Counting the moments until we meet ✨", "You're always in my heart 💗"],
  tired: ["Rest well, my love. You deserve it 🌙", "Take care of yourself 💕", "Sleep tight, beautiful 🌸"],
  study: ["You're doing amazing! Keep going! 📚✨", "Future lawyer in the making! ⚖️💪", "I believe in you so much! 🌟"]
};

function checkAIAutoReply(text) {
  const lower = text.toLowerCase();
  let category = null;
  
  if (lower.includes("sad") || lower.includes("upset") || lower.includes("cry") || lower.includes("😢") || lower.includes("😭")) category = "sad";
  else if (lower.includes("happy") || lower.includes("excited") || lower.includes("yay") || lower.includes("🎉")) category = "happy";
  else if (lower.includes("angry") || lower.includes("mad") || lower.includes("frustrated")) category = "angry";
  else if (lower.includes("tired") || lower.includes("exhausted") || lower.includes("sleepy")) category = "tired";
  else if (lower.includes("study") || lower.includes("exam") || lower.includes("homework")) category = "study";
  
  if (category) {
    // Show AI suggestion (not auto-send, just suggest)
    showAISuggestion(category);
  }
}

function showAISuggestion(category) {
  const replies = AI_REPLIES[category];
  if (!replies || !replies.length) return;
  const suggestion = replies[Math.floor(Math.random() * replies.length)];

  let bar = document.getElementById("chat-ai-suggest");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "chat-ai-suggest";
    bar.className = "chat-ai-suggest";
    const inputRow = document.querySelector(".chat-input-row");
    if (inputRow) inputRow.parentElement.insertBefore(bar, inputRow);
  }

  bar.innerHTML = "";
  const iconEl = document.createElement("span");
  iconEl.className = "ai-icon";
  iconEl.textContent = "🤖";

  const textEl = document.createElement("span");
  textEl.className = "ai-text";
  textEl.textContent = suggestion;

  const sendBtn = document.createElement("button");
  sendBtn.type = "button";
  sendBtn.className = "ai-send-btn";
  sendBtn.textContent = "Send";
  sendBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sendAISuggestion(suggestion);
  });

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "ai-close-btn";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hideAISuggestion();
  });

  bar.appendChild(iconEl);
  bar.appendChild(textEl);
  bar.appendChild(sendBtn);
  bar.appendChild(closeBtn);
  bar.style.display = "flex";

  if (window.__aiSuggestTimer) clearTimeout(window.__aiSuggestTimer);
  window.__aiSuggestTimer = setTimeout(hideAISuggestion, 8000);
}

function sendAISuggestion(text) {
  const input = document.getElementById("chat-input");
  if (input) {
    input.value = text;
    sendMessage();
  }
  hideAISuggestion();
}

function hideAISuggestion() {
  const bar = document.getElementById("chat-ai-suggest");
  if (bar) bar.style.display = "none";
}

// ─── TRANSLATE MESSAGE ────────────────────────────────────
function translateMessage(key, text) {
  const source = text || (allMessages[key] && allMessages[key].text) || "";
  if (!source) {
    showPremiumToast("Nothing to translate!");
    return;
  }
  if (typeof fetch !== "function") {
    showPremiumToast("Translation needs internet 🌐");
    return;
  }

  showPremiumToast("Translating… 🌐");

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(source)}&langpair=en|hi`;

  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      const translated = data && data.responseData && data.responseData.translatedText;
      if (!translated) {
        showPremiumToast("Translation failed. Try again!");
        return;
      }
      translatedTexts[key] = translated;
      const el = document.querySelector(`.msg[data-key="${key}"] .msg-text`);
      if (el) {
        el.textContent = translated;
        el.title = "Original: " + source;
        el.dataset.translated = "true";
      }
      showPremiumToast("Translated: " + translated);
    })
    .catch(() => {
      showPremiumToast("Translation failed. Try again!");
    });
}

// ─── SPEECH TO TEXT ───────────────────────────────────────
function startSpeechToText() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showPremiumToast("Speech recognition not supported in this browser");
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = false;
  
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const input = document.getElementById("chat-input");
    if (input) {
      input.value += (input.value ? " " : "") + text;
      input.focus();
    }
    showPremiumToast("Speech captured! 🎙");
  };
  
  recognition.onerror = (event) => {
    showPremiumToast("Speech error: " + event.error);
  };
  
  recognition.onend = () => {
    const micBtn = document.getElementById("chat-mic-btn");
    if (micBtn) micBtn.classList.remove("recording");
  };
  
  const micBtn = document.getElementById("chat-mic-btn");
  if (micBtn) micBtn.classList.add("recording");
  
  recognition.start();
  showPremiumToast("Listening... 🎙 Speak now!");
}

// ─── LIVE LOCATION ────────────────────────────────────────
function shareLocation() {
  if (!navigator.geolocation) {
    showPremiumToast("Location not supported!");
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      chatRef.push({
        type: "location",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        sender: myName,
        timestamp: Date.now(),
        deviceId: myDeviceId,
        read: false
      });
      playSendSound();
      showPremiumToast("Location shared! 📍");
    },
    (err) => {
      showPremiumToast("Location access denied!");
    }
  );
}

// ─── SPOTIFY SHARING ──────────────────────────────────────
function shareSpotify() {
  const songName = prompt("Enter song name to share:");
  if (!songName) return;
  const artist = prompt("Artist name:") || "Unknown";
  
  chatRef.push({
    type: "spotify",
    songName: songName,
    artist: artist,
    sender: myName,
    timestamp: Date.now(),
    deviceId: myDeviceId,
    read: false
  });
  playSendSound();
  showPremiumToast("Song shared! 🎵");
}

// ─── MESSAGE FORWARD ──────────────────────────────────────
function forwardMessage(key, text) {
  // In a multi-chat system this would forward to another chat
  // For now, copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showPremiumToast("Message copied! Forward by pasting 📤");
    });
  } else {
    showPremiumToast("Forward: " + text.substring(0, 50));
  }
}

// ─── EXPORT CHAT ──────────────────────────────────────────
function exportChat(format) {
  const msgs = Object.entries(allMessages).sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  if (format === "txt") {
    let text = "=== Ankit & Naincy Chat Export ===\n";
    text += "Exported: " + new Date().toLocaleString() + "\n\n";
    msgs.forEach(([key, msg]) => {
      const time = new Date(msg.timestamp).toLocaleString();
      text += `[${time}] ${msg.sender}: ${msg.text || "[media]"}\n`;
    });
    downloadFile("chat-export.txt", text, "text/plain");
  } else if (format === "html") {
    let html = `<!DOCTYPE html><html><head><title>Chat Export</title>
    <style>body{font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#1a1a2e;color:#fff}
    .msg{padding:8px 12px;margin:8px 0;border-radius:12px}
    .me{background:linear-gradient(135deg,#ff4d8d,#d946ef);text-align:right}
    .them{background:rgba(255,255,255,0.1)}
    .meta{font-size:0.7rem;opacity:0.6}</style></head><body>
    <h1>💕 Chat Export</h1><p>Exported: ${new Date().toLocaleString()}</p>`;
    msgs.forEach(([key, msg]) => {
      const isMe = msg.sender === myName;
      const time = new Date(msg.timestamp).toLocaleString();
      html += `<div class="msg ${isMe ? 'me' : 'them'}">
        <div>${escapeHtml(msg.text || "[media]")}</div>
        <div class="meta">${escapeHtml(msg.sender)} · ${time}</div>
      </div>`;
    });
    html += "</body></html>";
    downloadFile("chat-export.html", html, "text/html");
  } else if (format === "pdf") {
    // Print-friendly page kholte hain → browser ke "Save as PDF" se PDF banega
    const rows = msgs.map(([key, msg]) => {
      const isMe = msg.sender === myName;
      return `<div class="row ${isMe ? "me" : "them"}">
        <div class="bubble">${escapeHtml(msg.text || "[media]")}
          <div class="meta">${escapeHtml(msg.sender || "")} · ${escapeHtml(formatChatDateTime(msg.timestamp))}</div>
        </div>
      </div>`;
    }).join("");

    const printHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Chat Export</title>
      <style>
        body{font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:720px;margin:0 auto;padding:24px;color:#111}
        h1{font-size:1.2rem;margin:0 0 4px}
        .sub{color:#666;font-size:.8rem;margin-bottom:20px}
        .row{display:flex;margin:6px 0}
        .row.me{justify-content:flex-end}
        .bubble{max-width:75%;padding:8px 12px;border-radius:12px;font-size:.9rem;background:#f1f1f4}
        .row.me .bubble{background:#ffe3ee}
        .meta{font-size:.65rem;color:#777;margin-top:4px}
        @media print{.row{break-inside:avoid}}
      </style></head><body>
      <h1>💕 Chat Export</h1>
      <div class="sub">Exported: ${escapeHtml(new Date().toLocaleString())}</div>
      ${rows}
      <script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script>
      </body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(printHtml);
      win.document.close();
      showPremiumToast("Print dialog → 'Save as PDF' 📄");
    } else {
      downloadFile("chat-export.html", printHtml, "text/html");
      showPremiumToast("Popup blocked — HTML export download kiya 📥");
    }
    return;
  }
  showPremiumToast("Chat exported! 📥");
}

function downloadFile(filename, content, type) {
  try {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // turant revoke karne se download cancel ho jata tha
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (e) {
    showPremiumToast("Download failed in this browser!");
  }
}

// ─── QUICK REPLY ──────────────────────────────────────────
function quickReply(text) {
  const input = document.getElementById("chat-input");
  if (input) {
    input.value = text;
    sendMessage();
  }
}

// ─── DELETE MESSAGE ──────────────────────────────────────
function deleteMessage(key) {
  if (!key) return;
  if (!confirm("Delete this message?")) return;

  chatRef.child(key).remove().catch(() => {});
  // orphan data saaf karo
  db.ref("reactions/" + key).remove().catch(() => {});
  pinnedRef.child(key).remove().catch(() => {});
  favoritesRef.child(key).remove().catch(() => {});
  delete allMessages[key];
  delete allReactions[key];
  delete allPinned[key];
  delete allFavorites[key];
  delete translatedTexts[key];
  renderAllMessages();
}

// ─── REACT TO MESSAGE ────────────────────────────────────
function reactToMessage(key, emoji) {
  if (!key) return;
  const reactRef = db.ref("reactions/" + key);
  const mine = allReactions[key] && allReactions[key][myName];

  if (mine && mine.emoji === emoji) {
    reactRef.child(myName).remove();   // same emoji dobara = reaction hatao
    return;
  }

  reactRef.child(myName).set({
    emoji: emoji,
    timestamp: Date.now()
  });
}

// ─── LOVE RAIN EFFECT ────────────────────────────────────
function triggerLoveRain() {
  const container = document.getElementById("chat-messages");
  if (!container) return;

  const hearts = ["💕", "💗", "💖", "❤️", "💝", "💘", "🌹", "✨", "💫", "🦋"];
  for (let i = 0; i < 20; i++) {
    const h = document.createElement("span");
    h.className = "chat-love-rain-heart";
    h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    h.style.left = Math.random() * 100 + "%";
    h.style.setProperty("--lr-dur", 1.5 + Math.random() * 1.5 + "s");
    h.style.setProperty("--lr-delay", Math.random() * 0.5 + "s");
    h.style.setProperty("--lr-size", 14 + Math.random() * 14 + "px");
    h.style.setProperty("--lr-drift", -30 + Math.random() * 60 + "px");
    container.appendChild(h);
    setTimeout(() => h.remove(), 3500);
  }
}

// ─── ESCAPE HTML ─────────────────────────────────────────
function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

// ─── TIME AGO HELPER ─────────────────────────────────────
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  return days + "d ago";
}

// ─── TOAST NOTIFICATION ───────────────────────────────────
function showPremiumToast(message) {
  let toast = document.getElementById("chat-premium-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "chat-premium-toast";
    toast.className = "chat-premium-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// ─── EMOJI PICKER ────────────────────────────────────────
const CHAT_EMOJIS = [
  "❤️", "💕", "💗", "😍", "🥰", "😘", "💋", "🤗",
  "😊", "😂", "🥺", "😢", "😭", "🙈", "💪", "👏",
  "🔥", "✨", "💫", "🌸", "🌹", "🦋", "👑", "💯",
  "🎉", "🎊", "☕", "📚", "⚖️", "💕", "💝", "🫶"
];

let emojiPickerOpen = false;

function toggleEmojiPicker() {
  emojiPickerOpen = !emojiPickerOpen;
  let picker = document.getElementById("chat-emoji-picker");

  if (!picker) {
    picker = document.createElement("div");
    picker.id = "chat-emoji-picker";
    picker.className = "chat-emoji-picker";

    CHAT_EMOJIS.forEach((emoji) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-emoji-btn";
      btn.textContent = emoji;
      btn.addEventListener("click", () => {
        const input = document.getElementById("chat-input");
        if (input) {
          input.value += emoji;
          input.focus();
        }
      });
      picker.appendChild(btn);
    });

    const inputRow = document.querySelector(".chat-input-row");
    if (inputRow) inputRow.parentElement.insertBefore(picker, inputRow);
  }

  picker.classList.toggle("open", emojiPickerOpen);
  const toggleBtn = document.getElementById("chat-emoji-toggle");
  if (toggleBtn) toggleBtn.classList.toggle("active", emojiPickerOpen);
}

// ─── REACTION PICKER ──────────────────────────────────────
let activeReactionPicker = null;

function showReactionPicker(msgKey, anchorEl) {
  if (activeReactionPicker) {
    activeReactionPicker.remove();
    activeReactionPicker = null;
  }

  const picker = document.createElement("div");
  picker.className = "chat-reaction-picker";

  const reactions = ["❤️", "😂", "😍", "🥰", "👏", "🔥", "💕", "😢"];
  reactions.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = emoji;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      reactToMessage(msgKey, emoji);
      picker.remove();
      activeReactionPicker = null;
    });
    picker.appendChild(btn);
  });

  const rect = anchorEl.getBoundingClientRect();
  const pickerWidth = reactions.length * 38 + 24;
  let leftPos = rect.left;
  if (leftPos + pickerWidth > window.innerWidth - 12) leftPos = window.innerWidth - pickerWidth - 12;
  if (leftPos < 8) leftPos = 8;
  let topPos = rect.top - 52;
  if (topPos < 8) topPos = rect.bottom + 8;

  picker.style.position = "fixed";
  picker.style.left = leftPos + "px";
  picker.style.top = topPos + "px";
  picker.style.zIndex = "11000";

  document.body.appendChild(picker);
  activeReactionPicker = picker;

  setTimeout(() => {
    document.addEventListener("click", closeReactionPicker, { once: true });
  }, 10);
}

function closeReactionPicker() {
  if (activeReactionPicker) {
    activeReactionPicker.remove();
    activeReactionPicker = null;
  }
}

// ─── PREMIUM ATTACHMENT MENU ──────────────────────────────
let attachMenuOpen = false;

function toggleAttachMenu() {
  attachMenuOpen = !attachMenuOpen;
  let menu = document.getElementById("chat-attach-menu");
  
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "chat-attach-menu";
    menu.className = "chat-attach-menu";
    menu.innerHTML = `
      <div class="attach-grid">
        <button class="attach-item" onclick="sendImage(); toggleAttachMenu();">
          <span>📸</span><span>Photo</span>
        </button>
        <button class="attach-item" onclick="sendVideo(); toggleAttachMenu();">
          <span>🎥</span><span>Video</span>
        </button>
        <button class="attach-item" onclick="sendFile(); toggleAttachMenu();">
          <span>📄</span><span>File</span>
        </button>
        <button class="attach-item" onclick="toggleVoiceRecord(); toggleAttachMenu();">
          <span>🎤</span><span>Voice</span>
        </button>
        <button class="attach-item" onclick="sendStickerMenu(); toggleAttachMenu();">
          <span>😊</span><span>Sticker</span>
        </button>
        <button class="attach-item" onclick="toggleGifPicker(); toggleAttachMenu();">
          <span>🎭</span><span>GIF</span>
        </button>
        <button class="attach-item" onclick="shareLocation(); toggleAttachMenu();">
          <span>📍</span><span>Location</span>
        </button>
        <button class="attach-item" onclick="shareSpotify(); toggleAttachMenu();">
          <span>🎵</span><span>Music</span>
        </button>
        <button class="attach-item" onclick="sendSecretMessage(); toggleAttachMenu();">
          <span>🤫</span><span>Secret</span>
        </button>
        <button class="attach-item" onclick="sendSelfDestructMessage(); toggleAttachMenu();">
          <span>💣</span><span>Destruct</span>
        </button>
        <button class="attach-item" onclick="sendScheduledMessage(); toggleAttachMenu();">
          <span>⏰</span><span>Schedule</span>
        </button>
        <button class="attach-item" onclick="triggerMessageAnimation('confetti'); toggleAttachMenu();">
          <span>🎊</span><span>Confetti</span>
        </button>
        <button class="attach-item" onclick="triggerMessageAnimation('fireworks'); toggleAttachMenu();">
          <span>🎆</span><span>Fireworks</span>
        </button>
        <button class="attach-item" onclick="triggerMessageAnimation('snow'); toggleAttachMenu();">
          <span>❄️</span><span>Snow</span>
        </button>
        <button class="attach-item" onclick="triggerMessageAnimation('balloons'); toggleAttachMenu();">
          <span>🎈</span><span>Balloons</span>
        </button>
      </div>
    `;
    const inputRow = document.querySelector(".chat-input-row");
    if (inputRow) inputRow.parentElement.insertBefore(menu, inputRow);
  }
  
  menu.classList.toggle("open", attachMenuOpen);
}

function sendStickerMenu() {
  toggleStickerPicker();
}

// ─── PREMIUM SETTINGS MENU ────────────────────────────────
function openChatAnalyst() {
  let panel = document.getElementById("chat-analyst-panel");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "chat-analyst-panel";
    panel.className = "chat-analyst-panel";
    document.body.appendChild(panel);
  }

  async function renderAnalyst() {
    let stats = { empty: true, total: 0, bySender: {}, activeDays: 0, topSender: null, topEmoji: [], byHour: Array(24).fill(0), topHour: 0, topDay: null, linkCount: 0, chatDays: 0, avgPerDay: 0, currentStreak: 0 };

    try {
      stats = await window.NK.dashboard.compute(true);
    } catch (error) {
      console.error("Chat analyst failed:", error);
    }

    const msgs = Object.values(allMessages || {});
    const topSenderName = stats.topSender ? stats.topSender.name : (Object.entries(stats.bySender || {}).sort((a, b) => b[1] - a[1])[0] || ["—", 0])[0];
    const topSenderCount = stats.topSender ? stats.topSender.count : (Object.entries(stats.bySender || {}).sort((a, b) => b[1] - a[1])[0] || ["—", 0])[1];
    const activeDays = stats.chatDays || new Set(msgs.map((m) => window.NK.utils.dayKey(m.timestamp))).size;
    const dayCount = stats.total || msgs.length;
    const topEmoji = stats.topEmoji && stats.topEmoji.length ? stats.topEmoji.map(([emoji, count]) => `${emoji} ${count}`).join(" • ") : "❤️ 1";
    const topHour = (stats.topHour !== undefined && stats.topHour !== null) ? stats.topHour : 0;
    const topDay = stats.topDay ? stats.topDay.day : "—";
    const avgPerDay = stats.avgPerDay || (dayCount && activeDays ? (dayCount / activeDays).toFixed(1) : 0);

    panel.innerHTML = `
      <div class="chat-analyst-card">
        <div class="analyst-header">
          <div>
            <p class="analyst-kicker">Chat Settings</p>
            <h3>📊 Chat Analyst</h3>
          </div>
          <button onclick="closeChatAnalyst()" type="button">✕</button>
        </div>

        <div class="analyst-grid">
          <div class="analyst-box accent">
            <span>Total Messages</span>
            <strong>${dayCount}</strong>
          </div>
          <div class="analyst-box">
            <span>Active Days</span>
            <strong>${activeDays}</strong>
          </div>
          <div class="analyst-box">
            <span>Top Sender</span>
            <strong>${escapeHtml(topSenderName)}</strong>
          </div>
          <div class="analyst-box">
            <span>Streak</span>
            <strong>🔥 ${streakData.days}</strong>
          </div>
        </div>

        <div class="analyst-chart-card">
          <h4>💬 Relationship Dashboard</h4>
          <div class="analyst-metrics">
            <div><span>Most active day</span><strong>${escapeHtml(topDay)}</strong></div>
            <div><span>Top hour</span><strong>${topHour}:00</strong></div>
            <div><span>Avg/day</span><strong>${avgPerDay}</strong></div>
            <div><span>Links shared</span><strong>${stats.linkCount || 0}</strong></div>
          </div>
          <div class="analyst-emoji-box">
            <span>Top emoji</span>
            <strong>${escapeHtml(topEmoji)}</strong>
          </div>
        </div>

        <div class="analyst-senders">
          <h4>👥 Sender Activity</h4>
          ${Object.entries(stats.bySender || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => `
            <div class="sender-row">
              <span>${escapeHtml(name)}</span>
              <div class="sender-glow"><i style="width:${Math.max(18, (count / Math.max(1, dayCount)) * 100)}%"></i></div>
              <strong>${count}</strong>
            </div>
          `).join("") || '<p class="analyst-empty">No messages yet.</p>'}
        </div>
      </div>
    `;

    panel.classList.add("open");
  }

  renderAnalyst();
}

function closeChatAnalyst() {
  const panel = document.getElementById("chat-analyst-panel");
  if (panel) panel.classList.remove("open");
}

function togglePremiumMenu() {
  let menu = document.getElementById("chat-premium-menu");
  
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "chat-premium-menu";
    menu.className = "chat-premium-menu";
    menu.innerHTML = `
      <div class="premium-menu-card">
        <h3>⚙️ Chat Settings</h3>
        <div class="premium-menu-items">
          <button onclick="toggleSearch(); togglePremiumMenu();">🔍 Search Messages</button>
          <button onclick="toggleStats(); togglePremiumMenu();">📊 Chat Statistics</button>
          <button onclick="openChatAnalyst(); togglePremiumMenu();">📈 Chat Analyst</button>
          <button onclick="toggleCalendar(); togglePremiumMenu();">📅 Chat Calendar</button>
          <button onclick="showThemePicker(); togglePremiumMenu();">🎨 Chat Themes</button>
          <button onclick="toggleFavoriteView(); togglePremiumMenu();">⭐ Favorite Messages</button>
          <button onclick="exportChat('txt'); togglePremiumMenu();">📥 Export (TXT)</button>
          <button onclick="exportChat('html'); togglePremiumMenu();">📥 Export (HTML)</button>
          <button onclick="exportChat('pdf'); togglePremiumMenu();">📥 Export (PDF)</button>
          <button onclick="setChatPin(); togglePremiumMenu();">🔒 Set PIN Lock</button>
          <button onclick="removeChatPin(); togglePremiumMenu();">🔓 Remove PIN Lock</button>
          <button onclick="toggleChatSound(); togglePremiumMenu();">🔔 Sound: ${chatSoundEnabled ? 'ON' : 'OFF'}</button>
          <button onclick="startWebRTCCall('voice'); togglePremiumMenu();">📞 Voice Call</button>
          <button onclick="startWebRTCCall('video'); togglePremiumMenu();">📹 Video Call</button>
        </div>
        <button class="premium-menu-close" onclick="togglePremiumMenu()">✕ Close</button>
      </div>
    `;
    document.body.appendChild(menu);
  }
  
  menu.classList.toggle("open");
}

function showThemePicker() {
  let picker = document.getElementById("chat-theme-picker");
  if (!picker) {
    picker = document.createElement("div");
    picker.id = "chat-theme-picker";
    picker.className = "chat-theme-picker";
    document.body.appendChild(picker);
  }
  
  picker.innerHTML = `
    <div class="theme-picker-card">
      <h3>🎨 Chat Themes</h3>
      <div class="theme-grid">
        ${Object.entries(CHAT_THEMES).map(([key, theme]) => `
          <button class="theme-option ${currentTheme === key ? 'active' : ''}" 
                  onclick="applyChatTheme('${key}'); closeThemePicker();">
            <span class="theme-preview" style="background: ${theme.msgMe}"></span>
            <span class="theme-name">${theme.name}</span>
          </button>
        `).join("")}
      </div>
      <button onclick="closeThemePicker()">Close</button>
    </div>
  `;
  picker.classList.add("open");
}

function closeThemePicker() {
  const picker = document.getElementById("chat-theme-picker");
  if (picker) picker.classList.remove("open");
}

function toggleFavoriteView() {
  let panel = document.getElementById("chat-favorites-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "chat-favorites-panel";
    panel.className = "chat-favorites-panel";
    document.body.appendChild(panel);
  }
  
  const isOpen = panel.classList.contains("open");
  if (!isOpen) {
    const favMsgs = Object.entries(allFavorites).map(([key]) => {
      const msg = allMessages[key];
      return msg ? { key, ...msg } : null;
    }).filter(Boolean);
    
    panel.innerHTML = `
      <div class="favorites-card">
        <h3>⭐ Favorite Messages</h3>
        <div class="favorites-list">
          ${favMsgs.length === 0 ? '<p class="favorites-empty">No favorites yet. Star messages to add them here!</p>' : 
            favMsgs.map(msg => `
              <div class="fav-item">
                <span class="fav-sender">${escapeHtml(msg.sender)}</span>
                <span class="fav-text">${escapeHtml(msg.text || "[media]")}</span>
                <span class="fav-time">${timeAgo(msg.timestamp)}</span>
              </div>
            `).join("")}
        </div>
        <button onclick="document.getElementById('chat-favorites-panel').classList.remove('open')">Close</button>
      </div>
    `;
    panel.classList.add("open");
  } else {
    panel.classList.remove("open");
  }
}

// ─── WEBRTC (Basic Framework) ─────────────────────────────
function startWebRTCCall(type) {
  showPremiumToast(`${type === 'voice' ? '📞' : '📹'} ${type} call - Coming Soon!`);
  // WebRTC implementation would require a signaling server
  // This is a placeholder for the framework
}

/* ═══════════════════════════════════════════════════════════
   RENDER ENGINE
   • WhatsApp style date separators → Today / Yesterday / date
   • Incremental re-render (audio/video playback, scroll,
     animations aur images reset nahi hote)
   • Sound / notification sirf naye incoming message par
   • Read receipt ek hi baar DB me likha jaata hai (loop fix)
   ═══════════════════════════════════════════════════════════ */

let chatRenderCache = null;        // last snapshot data (theme change par reuse)
let lastRenderedLastKey = "";      // last rendered message key
let firstRenderDone = false;
let lastActiveDayKey = "";
const translatedTexts = {};        // key -> translated text (re-render me bacha rehta hai)
const destructedKeys = new Set();
const destructTimers = {};
const pendingReadKeys = new Set();
let readFlushTimer = null;

/* ── Date separator ─────────────────────────────────────── */
function buildDateSeparator(ts) {
  const wrap = document.createElement("div");
  wrap.className = "chat-date-separator";
  wrap.dataset.dayKey = window.NK.utils.dayKey(ts);

  const pill = document.createElement("span");
  pill.textContent = formatChatDateLabel(ts);
  pill.title = new Date(ts).toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  wrap.appendChild(pill);
  return wrap;
}

/* ── Signature: kya ye bubble rebuild karna zaroori hai? ── */
function msgSignature(key, msg) {
  if (!msg) return key;
  const copy = {};
  Object.keys(msg).forEach((k) => {
    if (k !== "read") copy[k] = msg[k];   // read sirf tick badalta hai, rebuild nahi
  });
  const reactions = allReactions[key] ? JSON.stringify(allReactions[key]) : "";
  const translated = translatedTexts[key] ? "|t" : "";
  return key + "|" + JSON.stringify(copy) + "|" + reactions + translated;
}

function updateMsgStatusEl(el, msg) {
  const statusEl = el.querySelector(".msg-status");
  if (!statusEl) return;
  if (msg && msg.read) {
    statusEl.innerHTML = '<span class="msg-seen">✓✓</span>';
    statusEl.title = "Seen";
  } else {
    statusEl.innerHTML = '<span class="msg-delivered">✓</span>';
    statusEl.title = "Delivered";
  }
}

function mediaLabel(msg) {
  const map = {
    image: "📸 Photo", video: "🎥 Video", voice: "🎤 Voice message",
    sticker: "😊 Sticker", gif: "🎭 GIF", file: "📄 File",
    location: "📍 Location", spotify: "🎵 Song"
  };
  return map[msg && msg.type] || "[Media]";
}

function notifyIncoming(msg) {
  if (!msg || typeof ChatNotifications === "undefined") return;
  try {
    const text = msg.text || mediaLabel(msg);
    if (ChatNotifications.getPermission && ChatNotifications.getPermission() === "default") {
      ChatNotifications.requestPermission().then((permission) => {
        if (permission === "granted") ChatNotifications.notifyNewMessage(msg.sender, text, false);
      }).catch(() => {});
    } else if (ChatNotifications.canNotify && ChatNotifications.canNotify()) {
      ChatNotifications.notifyNewMessage(msg.sender, text, false);
    }
  } catch (e) {}
}

function scheduleReadFlush() {
  if (readFlushTimer) return;
  readFlushTimer = setTimeout(() => {
    readFlushTimer = null;
    const keys = Array.from(pendingReadKeys).slice(0, 20);
    pendingReadKeys.clear();
    keys.forEach((key) => {
      const msg = allMessages[key];
      if (msg && msg.sender !== myName && !msg.read) {
        chatRef.child(key).update({ read: true }).catch(() => {});
      }
    });
    // beech me naye keys aaye ho to dobara schedule karo (koi unread na chhoote)
    if (pendingReadKeys.size > 0) scheduleReadFlush();
  }, 500);
}

function destroySelfDestructMsg(el, key) {
  if (!el) return;
  el.style.opacity = "0.35";
  el.innerHTML = '<span class="msg-deleted">💨 Message self-destructed</span>';
  if (key && !destructedKeys.has(key)) {
    destructedKeys.add(key);
    chatRef.child(key).remove().catch(() => {});
  }
}

function renderAllMessages() {
  if (chatRenderCache) {
    renderMessages({ val: () => chatRenderCache });
  } else {
    chatRef.limitToLast(80).once("value", (snap) => renderMessages(snap));
  }
}

db.ref("reactions").on("value", (snap) => {
  allReactions = snap.val() || {};
  const box = document.getElementById("chat-box");
  if (box && box.classList.contains("open")) renderAllMessages();
});

/* ── Ek message ka bubble banao ─────────────────────────── */
function buildMessageElement(key, msg) {
  const isMe = msg.sender === myName;
  const ts = Number(msg.timestamp) || Date.now();

  const div = document.createElement("div");
  div.className = "msg " + (isMe ? "me" : "them");
  div.dataset.key = key;
  div.dataset.sig = msgSignature(key, msg);

  // Double tap = ❤️ (button/link/media par nahi)
  div.addEventListener("click", (e) => {
    if (e.target.closest("button, a, audio, video, input, .msg-secret")) return;
    handleDoubleTap(key, div);
  });

  // Sender name
  if (!isMe && msg.sender) {
    const senderEl = document.createElement("div");
    senderEl.className = "msg-sender";
    senderEl.textContent = msg.sender;
    div.appendChild(senderEl);
  }

  // Reply preview
  if (msg.replyTo) {
    const replyEl = document.createElement("div");
    replyEl.className = "msg-reply-preview";

    const line = document.createElement("div");
    line.className = "reply-line";

    const content = document.createElement("div");
    content.className = "reply-content";

    const nameEl = document.createElement("span");
    nameEl.className = "reply-name";
    nameEl.textContent = msg.replySender || "Unknown";

    const textEl = document.createElement("span");
    textEl.className = "reply-text";
    textEl.textContent = String(msg.replyText || "").substring(0, 40);

    content.appendChild(nameEl);
    content.appendChild(textEl);
    replyEl.appendChild(line);
    replyEl.appendChild(content);
    div.appendChild(replyEl);
  }

  // ── Content ─────────────────────────────────────────────
  if (msg.type === "image" && msg.imageUrl) {
    const wrap = document.createElement("div");
    wrap.className = "msg-image";
    const img = document.createElement("img");
    img.src = msg.imageUrl;
    img.alt = "Shared image";
    img.loading = "lazy";
    img.addEventListener("click", (e) => {
      e.stopPropagation();
      openImageZoom(key);
    });
    wrap.appendChild(img);
    div.appendChild(wrap);

  } else if (msg.type === "video" && msg.videoUrl) {
    const wrap = document.createElement("div");
    wrap.className = "msg-video";
    const video = document.createElement("video");
    video.src = msg.videoUrl;
    video.controls = true;
    video.preload = "metadata";
    wrap.appendChild(video);
    div.appendChild(wrap);

  } else if (msg.type === "voice" && msg.voiceUrl) {
    const wrap = document.createElement("div");
    wrap.className = "msg-voice";
    const audio = document.createElement("audio");
    audio.src = msg.voiceUrl;
    audio.controls = true;
    audio.preload = "metadata";
    audio.className = "voice-player";
    const dur = document.createElement("span");
    dur.className = "voice-duration";
    dur.textContent = formatDuration(msg.duration);
    wrap.appendChild(audio);
    wrap.appendChild(dur);
    div.appendChild(wrap);

  } else if (msg.type === "file" && msg.fileUrl) {
    const wrap = document.createElement("div");
    wrap.className = "msg-file";

    const icon = document.createElement("span");
    icon.className = "file-icon";
    icon.textContent = "📄";

    const info = document.createElement("div");
    info.className = "file-info";
    const nameEl = document.createElement("span");
    nameEl.className = "file-name";
    nameEl.textContent = msg.fileName || "file";
    const sizeEl = document.createElement("span");
    sizeEl.className = "file-size";
    sizeEl.textContent = formatFileSize(msg.fileSize);
    info.appendChild(nameEl);
    info.appendChild(sizeEl);

    const link = document.createElement("a");
    link.className = "file-download";
    link.href = msg.fileUrl;
    link.download = msg.fileName || "file";
    link.textContent = "⬇️";

    wrap.appendChild(icon);
    wrap.appendChild(info);
    wrap.appendChild(link);
    div.appendChild(wrap);

  } else if (msg.type === "sticker") {
    const wrap = document.createElement("div");
    wrap.className = "msg-sticker";
    wrap.textContent = msg.sticker || "❤️";
    div.appendChild(wrap);

  } else if (msg.type === "gif" && msg.gifUrl) {
    const wrap = document.createElement("div");
    wrap.className = "msg-gif";
    const img = document.createElement("img");
    img.src = msg.gifUrl;
    img.alt = "GIF";
    img.loading = "lazy";
    if (msg.gifOriginal) {
      img.style.cursor = "pointer";
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        window.open(msg.gifOriginal, "_blank");
      });
    }
    wrap.appendChild(img);
    div.appendChild(wrap);

  } else if (msg.type === "location") {
    const wrap = document.createElement("div");
    wrap.className = "msg-location";
    const icon = document.createElement("span");
    icon.className = "loc-icon";
    icon.textContent = "📍";
    const link = document.createElement("a");
    link.href = "https://maps.google.com/?q=" + encodeURIComponent(msg.lat + "," + msg.lng);
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = (msg.sender || "Someone") + " is here";
    wrap.appendChild(icon);
    wrap.appendChild(link);
    div.appendChild(wrap);

  } else if (msg.type === "spotify") {
    const wrap = document.createElement("div");
    wrap.className = "msg-spotify";
    const icon = document.createElement("span");
    icon.className = "spotify-icon";
    icon.textContent = "🎵";
    const info = document.createElement("div");
    info.className = "spotify-info";
    const song = document.createElement("span");
    song.className = "spotify-song";
    song.textContent = msg.songName || "";
    const artist = document.createElement("span");
    artist.className = "spotify-artist";
    artist.textContent = msg.artist || "";
    info.appendChild(song);
    info.appendChild(artist);
    wrap.appendChild(icon);
    wrap.appendChild(info);
    div.appendChild(wrap);

  } else if (msg.secret && !msg.revealed) {
    const secretEl = document.createElement("div");
    secretEl.className = "msg-secret";

    const icon = document.createElement("span");
    icon.className = "secret-icon";
    icon.textContent = "🤫";
    const label = document.createElement("span");
    label.className = "secret-label";
    label.textContent = "Tap to reveal secret message";

    secretEl.appendChild(icon);
    secretEl.appendChild(label);

    secretEl.addEventListener("click", (e) => {
      e.stopPropagation();          // bubble ka double-tap react na ho
      secretEl.className = "msg-secret revealed";
      secretEl.innerHTML = "";
      const txt = document.createElement("span");
      txt.className = "secret-text";
      txt.textContent = msg.text || "";
      secretEl.appendChild(txt);
      chatRef.child(key).update({ revealed: true }).catch(() => {});
    });

    div.appendChild(secretEl);

  } else if (msg.secret && msg.revealed) {
    const textNode = document.createElement("div");
    textNode.className = "msg-text msg-secret-revealed";
    textNode.textContent = msg.text || "";
    div.appendChild(textNode);

  } else if (msg.selfDestruct) {
    const wrap = document.createElement("div");
    wrap.className = "msg-self-destruct";

    const expiresAt = ts + (Number(msg.destructAfter) || 30) * 1000;

    const icon = document.createElement("span");
    icon.className = "destruct-icon";
    icon.textContent = "💣";

    const textEl = document.createElement("span");
    textEl.className = "destruct-text";
    textEl.textContent = msg.text || "";

    const timerEl = document.createElement("span");
    timerEl.className = "destruct-timer";
    timerEl.dataset.expires = String(expiresAt);

    wrap.appendChild(icon);
    wrap.appendChild(textEl);
    wrap.appendChild(timerEl);
    div.appendChild(wrap);

    const tick = () => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      timerEl.textContent = left + "s";
      return left;
    };

    if (tick() === 0) {
      destroySelfDestructMsg(div, key);
    } else if (!destructTimers[key]) {
      destructTimers[key] = setInterval(() => {
        if (tick() === 0 || !div.isConnected) {
          clearInterval(destructTimers[key]);
          delete destructTimers[key];
          if (div.isConnected) destroySelfDestructMsg(div, key);
        }
      }, 1000);
    }

  } else {
    const textNode = document.createElement("div");
    textNode.className = "msg-text";
    textNode.textContent = translatedTexts[key] || msg.text || "";
    if (translatedTexts[key]) textNode.title = "Original: " + (msg.text || "");
    div.appendChild(textNode);
  }

  // Edited / scheduled tags
  if (msg.edited) {
    const editTag = document.createElement("span");
    editTag.className = "msg-edited-tag";
    editTag.textContent = "✏️ edited";
    div.appendChild(editTag);
  }
  if (msg.scheduled) {
    const schedTag = document.createElement("span");
    schedTag.className = "msg-scheduled-tag";
    schedTag.textContent = "⏰ scheduled";
    div.appendChild(schedTag);
  }

  // ── Bottom row (time + tick) ────────────────────────────
  const bottomRow = document.createElement("div");
  bottomRow.className = "msg-bottom";

  const timeEl = document.createElement("span");
  timeEl.className = "msg-time";
  timeEl.textContent = formatChatTime(ts);
  timeEl.title = formatChatDateTime(ts);
  bottomRow.appendChild(timeEl);

  if (isMe) {
    const statusEl = document.createElement("span");
    statusEl.className = "msg-status";
    if (msg.read) {
      statusEl.innerHTML = '<span class="msg-seen">✓✓</span>';
      statusEl.title = "Seen";
    } else {
      statusEl.innerHTML = '<span class="msg-delivered">✓</span>';
      statusEl.title = "Delivered";
    }
    bottomRow.appendChild(statusEl);
  }

  div.appendChild(bottomRow);

  // ── Actions ─────────────────────────────────────────────
  const actionsEl = document.createElement("div");
  actionsEl.className = "msg-actions";

  const reactBtn = document.createElement("button");
  reactBtn.type = "button";
  reactBtn.className = "msg-action-btn";
  reactBtn.innerHTML = "😊";
  reactBtn.title = "React";
  reactBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showReactionPicker(key, div);
  });
  actionsEl.appendChild(reactBtn);

  const replyBtn = document.createElement("button");
  replyBtn.type = "button";
  replyBtn.className = "msg-action-btn";
  replyBtn.innerHTML = "↩️";
  replyBtn.title = "Reply";
  replyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    replyToMessage(key, msg.text || mediaLabel(msg), msg.sender);
  });
  actionsEl.appendChild(replyBtn);

  const moreBtn = document.createElement("button");
  moreBtn.type = "button";
  moreBtn.className = "msg-action-btn";
  moreBtn.innerHTML = "⋯";
  moreBtn.title = "More";
  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showMoreActions(key, msg, isMe, moreBtn);
  });
  actionsEl.appendChild(moreBtn);

  div.appendChild(actionsEl);

  // Reactions badges
  const reactions = allReactions[key];
  if (reactions) {
    const emojiCounts = {};
    Object.values(reactions).forEach((r) => {
      if (r && r.emoji) emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
    });
    const entries = Object.entries(emojiCounts);
    if (entries.length) {
      const reactionsEl = document.createElement("div");
      reactionsEl.className = "msg-reactions";
      reactionsEl.innerHTML = entries
        .map(([emoji, count]) => '<span class="msg-reaction-badge">' + emoji + (count > 1 ? " " + count : "") + "</span>")
        .join("");
      div.appendChild(reactionsEl);
    }
  }

  return div;
}

/* ── Main renderer ──────────────────────────────────────── */
function renderMessages(snapshot) {
  const messagesDiv = document.getElementById("chat-messages");
  if (!messagesDiv) return;

  const data = snapshot && typeof snapshot.val === "function" ? snapshot.val() : (snapshot || null);
  chatRenderCache = data;
  lastActiveDayKey = window.NK.utils.dayKey(Date.now());

  const box = document.getElementById("chat-box");
  const isChatOpen = !!(box && box.classList.contains("open"));
  const wasNearBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 140;

  if (!data || Object.keys(data).length === 0) {
    allMessages = {};
    window.allMessages = allMessages;
    messagesDiv.innerHTML = '<div class="chat-empty-state"><span class="chat-empty-icon">💌</span><p>No messages yet…<br>say something sweet 💕</p></div>';
    lastRenderedLastKey = "";
    firstRenderDone = true;
    return;
  }

  // stale entries hatao, naye merge karo
  Object.keys(allMessages).forEach((k) => { if (!data[k]) delete allMessages[k]; });
  Object.assign(allMessages, data);

  const sortedKeys = Object.keys(data).sort(
    (a, b) => (Number(data[a].timestamp) || 0) - (Number(data[b].timestamp) || 0)
  );
  const lastKey = sortedKeys[sortedKeys.length - 1] || "";
  const previousLastKey = lastRenderedLastKey;
  const newKeys = previousLastKey ? sortedKeys.filter((k) => k > previousLastKey) : [];
  const hasNewMessages = newKeys.length > 0;

  // purane bubbles reuse karo (media playback / scroll / images safe)
  const reusable = new Map();
  messagesDiv.querySelectorAll(".msg[data-key]").forEach((el) => reusable.set(el.dataset.key, el));

  const fragment = document.createDocumentFragment();
  let currentDayKey = "";

  sortedKeys.forEach((key) => {
    const msg = data[key] || {};
    const ts = Number(msg.timestamp) || Date.now();

    // ── DATE SEPARATOR: Today / Yesterday / date ──
    const dayKey = window.NK.utils.dayKey(ts);
    if (dayKey !== currentDayKey) {
      currentDayKey = dayKey;
      fragment.appendChild(buildDateSeparator(ts));
    }

    const oldEl = reusable.get(key);
    if (oldEl && oldEl.dataset.sig === msgSignature(key, msg)) {
      reusable.delete(key);
      updateMsgStatusEl(oldEl, msg);
      fragment.appendChild(oldEl);
    } else {
      reusable.delete(key);
      fragment.appendChild(buildMessageElement(key, msg));
    }

    if (msg.sender === myName) myMsgKeys.add(key);
  });

  // jo nodes reuse nahi hue wo stale hain
  messagesDiv.innerHTML = "";
  messagesDiv.appendChild(fragment);

  // ── unread ──
  const unreadKeys = sortedKeys.filter((k) => k > lastReadMsgKey && data[k] && data[k].sender !== myName);

  // ── sound + notification sirf genuinely naye incoming par ──
  if (firstRenderDone && hasNewMessages) {
    const incoming = newKeys.map((k) => data[k]).filter((m) => m && m.sender !== myName);
    if (incoming.length) {
      playMsgSound();
      notifyIncoming(incoming[incoming.length - 1]);
    }
  }

  if (!isChatOpen && unreadKeys.length) showNotifBadge(unreadKeys.length);

  // ── chat khula hai → read receipts (ek hi baar write) ──
  if (isChatOpen) {
    unreadKeys.slice(-20).forEach((k) => pendingReadKeys.add(k));
    scheduleReadFlush();
    if (lastKey && lastKey !== lastReadMsgKey) {
      lastReadMsgKey = lastKey;
      localStorage.setItem("chatLastRead", lastReadMsgKey);
    }
    showNotifBadge(0);
  }

  // ── scroll behaviour ──
  const lastMsgIsMine = !!(lastKey && data[lastKey] && data[lastKey].sender === myName);
  if (!firstRenderDone || wasNearBottom || (hasNewMessages && lastMsgIsMine)) {
    requestAnimationFrame(() => { messagesDiv.scrollTop = messagesDiv.scrollHeight; });
  }

  lastRenderedLastKey = lastKey;
  firstRenderDone = true;
  window.NK.dashboard.invalidate();
}

/* ── More menu (safe: koi inline JS string nahi) ─────────── */
function showMoreActions(key, msg, isMe, anchorBtn) {
  closeMoreMenu();

  const menu = document.createElement("div");
  menu.id = "chat-more-menu";
  menu.className = "chat-more-menu";

  const addItem = (label, handler) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeMoreMenu();
      handler();
    });
    menu.appendChild(btn);
  };

  addItem(allPinned[key] ? "📌 Unpin" : "📌 Pin", () => pinMessage(key));
  addItem(allFavorites[key] ? "⭐ Unfavorite" : "⭐ Favorite", () => favoriteMessage(key));
  addItem("📤 Forward / Copy", () => forwardMessage(key, msg.text || ""));
  if (msg.text) addItem("🌐 Translate", () => translateMessage(key, msg.text));

  const isMediaOnly = msg.type && msg.type !== "sticker" && msg.type !== "gif";
  if (isMe && !isMediaOnly) {
    const canEdit = Date.now() - (Number(msg.timestamp) || 0) < 600000;
    if (canEdit) addItem("✏️ Edit", () => editMessage(key, msg.text || ""));
    addItem("🗑️ Delete", () => deleteMessage(key));
  }
  if (msg.secret) addItem("🤫 Reveal", () => chatRef.child(key).update({ revealed: true }).catch(() => {}));

  const rect = anchorBtn.getBoundingClientRect();
  const menuWidth = 190;
  const menuHeight = menu.childElementCount * 40 + 16;
  let left = Math.min(rect.left, window.innerWidth - menuWidth - 10);
  if (left < 8) left = 8;
  let top = rect.top - menuHeight - 8;
  if (top < 8) top = Math.min(rect.bottom + 8, window.innerHeight - menuHeight - 8);

  menu.style.position = "fixed";
  menu.style.left = left + "px";
  menu.style.top = top + "px";
  menu.style.zIndex = "11000";

  document.body.appendChild(menu);

  setTimeout(() => {
    document.addEventListener("click", closeMoreMenu, { once: true });
  }, 10);
}

function closeMoreMenu() {
  const menu = document.getElementById("chat-more-menu");
  if (menu) menu.remove();
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function openImageZoom(key) {
  const msg = allMessages[key];
  if (!msg || !msg.imageUrl) return;
  const overlay = document.getElementById("zoom-overlay");
  const zoomImg = document.getElementById("zoom-img");
  if (overlay && zoomImg) {
    zoomImg.src = msg.imageUrl;
    overlay.classList.add("open");
  }
}

// Main message listener
chatRef.limitToLast(80).on("value", renderMessages);

// ─── NOTIFICATION BADGE ──────────────────────────────────
function showNotifBadge(count) {
  const toggleBtn = document.querySelector(".chat-toggle-btn");
  if (!toggleBtn) return;
  let badge = toggleBtn.querySelector(".chat-notif-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "chat-notif-badge";
    toggleBtn.appendChild(badge);
  }
  badge.textContent = count > 0 ? (count > 9 ? "9+" : count) : "";
  badge.style.display = count > 0 ? "flex" : "none";
}

// Read receipts render ke time par (debounced) bheje jaate hain — polling
// interval hataya gaya, warna har 3 second me poora chat re-render hota tha.

// ─── TYPING INDICATOR + ENTER TO SEND ────────────────────
const chatInput = document.getElementById("chat-input");
let typingTimeout = null;

function setTyping(isTyping) {
  try { typingRef.set(isTyping); } catch (e) {}
}

if (chatInput) {
  chatInput.addEventListener("input", () => {
    setTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => setTyping(false), 2000);
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    e.preventDefault();
    if (typingTimeout) clearTimeout(typingTimeout);
    setTyping(false);
    sendMessage();
  });

  chatInput.addEventListener("blur", () => {
    if (typingTimeout) clearTimeout(typingTimeout);
    setTyping(false);
  });
}

db.ref("typing").on("value", (snap) => {
  const data = snap.val() || {};
  const typingIndicator = document.getElementById("chat-typing");
  const typingOthers = Object.entries(data)
    .filter(([name, isTyping]) => name !== myName && isTyping === true)
    .map(([name]) => name);

  if (typingIndicator) {
    if (typingOthers.length > 0) {
      typingIndicator.innerHTML = `<span class="typing-dots"><span></span><span></span><span></span></span> ${typingOthers.join(", ")} is typing...`;
      typingIndicator.classList.add("visible");
    } else {
      typingIndicator.classList.remove("visible");
    }
  }
});

// ─── ONLINE STATUS + LAST SEEN ───────────────────────────
db.ref("presence").on("value", (snapshot) => {
  const data = snapshot.val() || {};
  const statusEl = document.getElementById("online-status");
  const dotEl = document.querySelector(".status-dot");
  if (!statusEl) return;

  const others = Object.entries(data).filter(([name]) => name !== myName);
  const onlineOther = others.find(([, d]) => d && d.online);

  if (onlineOther) {
    statusEl.textContent = onlineOther[0] + " is online 💕";
    if (dotEl) {
      dotEl.style.background = "#4ade80";
      dotEl.style.boxShadow = "0 0 8px rgba(74, 222, 128, 0.6)";
    }
  } else if (others.length) {
    const other = others[0];
    const lastSeen = other[1] && other[1].lastSeen;
    if (lastSeen) {
      statusEl.textContent = other[0] + " · last seen " + timeAgo(lastSeen);
    } else {
      statusEl.textContent = other[0] + " is offline";
    }
    if (dotEl) {
      dotEl.style.background = "#888";
      dotEl.style.boxShadow = "none";
    }
  } else {
    statusEl.textContent = "waiting for partner…";
    if (dotEl) {
      dotEl.style.background = "#fbbf24";
      dotEl.style.boxShadow = "0 0 8px rgba(251, 191, 36, 0.5)";
    }
  }
});

// ─── SOUND TOGGLE ────────────────────────────────────────
function toggleChatSound() {
  chatSoundEnabled = !chatSoundEnabled;
  localStorage.setItem("chatSound", chatSoundEnabled ? "on" : "off");
  const btn = document.getElementById("chat-sound-toggle");
  if (btn) {
    btn.textContent = chatSoundEnabled ? "🔔" : "🔕";
    btn.title = chatSoundEnabled ? "Sound On" : "Sound Off";
  }
}

// ─── ENHANCE CHAT UI ─────────────────────────────────────

  injectChatStyles();function enhanceChatUI() {
  const chatBox = document.getElementById("chat-box");
  if (!chatBox) return;

  // Typing indicator
  if (!document.getElementById("chat-typing")) {
    const typingEl = document.createElement("div");
    typingEl.id = "chat-typing";
    typingEl.className = "chat-typing-indicator";
    typingEl.innerHTML = "";
    const messagesDiv = document.getElementById("chat-messages");
    if (messagesDiv && messagesDiv.parentElement) {
      messagesDiv.parentElement.insertBefore(typingEl, messagesDiv.nextSibling);
    }
  }

  // Sound toggle + Premium menu button in header
  const chatHeader = chatBox.querySelector(".chat-header");
  if (chatHeader) {
    if (!document.getElementById("chat-sound-toggle")) {
      const soundBtn = document.createElement("button");
      soundBtn.type = "button";
      soundBtn.id = "chat-sound-toggle";
      soundBtn.className = "chat-header-btn";
      soundBtn.textContent = chatSoundEnabled ? "🔔" : "🔕";
      soundBtn.title = chatSoundEnabled ? "Sound On" : "Sound Off";
      soundBtn.addEventListener("click", toggleChatSound);
      const closeBtn = chatHeader.querySelector(".chat-close");
      if (closeBtn) chatHeader.insertBefore(soundBtn, closeBtn);
    }
    
    // Premium features button
    if (!document.getElementById("chat-premium-btn")) {
      const premBtn = document.createElement("button");
      premBtn.type = "button";
      premBtn.id = "chat-premium-btn";
      premBtn.className = "chat-header-btn";
      premBtn.textContent = "⚙️";
      premBtn.title = "Chat Settings";
      premBtn.setAttribute("aria-label", "Open chat settings");
      premBtn.addEventListener("click", togglePremiumMenu);
      const closeBtn = chatHeader.querySelector(".chat-close");
      if (closeBtn) chatHeader.insertBefore(premBtn, closeBtn);
    }
    
    // Streak display
    if (!document.getElementById("chat-streak-display")) {
      const streakEl = document.createElement("span");
      streakEl.id = "chat-streak-display";
      streakEl.className = "chat-streak-display";
      streakEl.innerHTML = `<span class="streak-fire">🔥</span> Day ${streakData.days}`;
      chatHeader.appendChild(streakEl);
    }
  }

  // Add attachment button to input row
  const inputRow = document.querySelector(".chat-input-row");
  if (inputRow) {
    if (!document.getElementById("chat-attach-btn")) {
      const attachBtn = document.createElement("button");
      attachBtn.type = "button";
      attachBtn.id = "chat-attach-btn";
      attachBtn.className = "chat-extra-btn";
      attachBtn.textContent = "📎";
      attachBtn.title = "Attach";
      attachBtn.addEventListener("click", toggleAttachMenu);
      inputRow.insertBefore(attachBtn, inputRow.firstChild);
    }
    
    // Mic button for speech-to-text
    if (!document.getElementById("chat-mic-btn")) {
      const micBtn = document.createElement("button");
      micBtn.type = "button";
      micBtn.id = "chat-mic-btn";
      micBtn.className = "chat-extra-btn";
      micBtn.textContent = "🎙";
      micBtn.title = "Speech to Text";
      micBtn.addEventListener("click", startSpeechToText);
      inputRow.insertBefore(micBtn, inputRow.lastElementChild);
    }
  }

  // Apply saved theme
  if (currentTheme && currentTheme !== "default") {
    applyChatTheme(currentTheme);
  }
}

// ─── EXPOSE FOR INLINE HANDLERS ──────────────────────────
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.quickReply = quickReply;
window.toggleEmojiPicker = toggleEmojiPicker;
window.toggleChatSound = toggleChatSound;
window.deleteMessage = deleteMessage;
window.reactToMessage = reactToMessage;
window.toggleStickerPicker = toggleStickerPicker;
window.toggleGifPicker = toggleGifPicker;
window.toggleSearch = toggleSearch;
window.toggleStats = toggleStats;
window.toggleCalendar = toggleCalendar;
window.toggleAttachMenu = toggleAttachMenu;
window.togglePremiumMenu = togglePremiumMenu;
window.toggleVoiceRecord = toggleVoiceRecord;
window.stopVoiceRecord = stopVoiceRecord;
window.cancelVoiceRecord = cancelVoiceRecord;
window.sendImage = sendImage;
window.sendVideo = sendVideo;
window.sendFile = sendFile;
window.sendSecretMessage = sendSecretMessage;
window.sendSelfDestructMessage = sendSelfDestructMessage;
window.sendScheduledMessage = sendScheduledMessage;
window.shareLocation = shareLocation;
window.shareSpotify = shareSpotify;
window.exportChat = exportChat;
window.applyChatTheme = applyChatTheme;
window.showThemePicker = showThemePicker;
window.closeThemePicker = closeThemePicker;
window.setChatPin = setChatPin;
window.removeChatPin = removeChatPin;
window.checkChatPin = checkChatPin;
window.closePinLock = closePinLock;
window.hideReplyBar = hideReplyBar;
window.cancelEdit = cancelEdit;
window.pinMessage = pinMessage;
window.favoriteMessage = favoriteMessage;
window.translateMessage = translateMessage;
window.forwardMessage = forwardMessage;
window.startSpeechToText = startSpeechToText;
window.sendAISuggestion = sendAISuggestion;
window.hideAISuggestion = hideAISuggestion;
window.searchMessages = searchMessages;
window.scrollToMessage = scrollToMessage;
window.loadCalendarDate = loadCalendarDate;
window.toggleFavoriteView = toggleFavoriteView;
window.startWebRTCCall = startWebRTCCall;
window.sendGif = sendGif;
window.searchGifs = searchGifs;
window.openImageZoom = openImageZoom;
window.triggerMessageAnimation = triggerMessageAnimation;
window.closeMoreMenu = closeMoreMenu;
window.updateStreak = updateStreak;

// ─── INLINE STYLES (date separator ke liye — CSS file chhedne ki zaroorat nahi) ──
function injectChatStyles() {
  if (document.getElementById("chat-premium-inline-styles")) return;

  const style = document.createElement("style");
  style.id = "chat-premium-inline-styles";
  style.textContent = `
    .chat-date-separator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      flex: 0 0 auto;
      margin: 14px 0 10px;
      padding: 0 8px;
      position: relative;
      z-index: 2;
      pointer-events: none;
      animation: chatDateSepIn 0.28s ease-out;
    }
    .chat-date-separator > span {
      display: inline-block;
      padding: 5px 13px;
      border-radius: 999px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      line-height: 1.25;
      color: #fff;
      background: rgba(17, 17, 27, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      white-space: nowrap;
    }
    .chat-box[data-theme="sakura"] .chat-date-separator > span,
    .chat-box[data-theme="pink"] .chat-date-separator > span,
    .chat-box[data-theme="glass"] .chat-date-separator > span {
      color: #7a1140;
      background: rgba(255, 255, 255, 0.78);
      border-color: rgba(236, 64, 122, 0.22);
    }
    .chat-box[data-theme="neon"] .chat-date-separator > span {
      color: #00ff88;
      background: rgba(0, 0, 0, 0.65);
      border-color: rgba(0, 255, 136, 0.35);
      text-shadow: 0 0 8px rgba(0, 255, 136, 0.4);
    }
    .chat-box[data-theme="galaxy"] .chat-date-separator > span {
      background: rgba(124, 77, 255, 0.28);
      border-color: rgba(124, 77, 255, 0.45);
    }
    .chat-date-separator:first-child { margin-top: 6px; }
    @keyframes chatDateSepIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .chat-date-separator { animation: none; }
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// ─── EXTRA EXPORTS ───────────────────────────────────────
window.renderAllMessages = renderAllMessages;
window.formatChatDateLabel = formatChatDateLabel;
window.formatChatTime = formatChatTime;
window.chatDayDiff = chatDayDiff;
window.chatRenderCache = () => chatRenderCache;

// ─── DAY CHANGE WATCHER (raat 12 baje "Today" → "Yesterday" refresh) ───
setInterval(() => {
  const todayKey = window.NK.utils.dayKey(Date.now());
  if (todayKey !== lastActiveDayKey && chatRenderCache) renderAllMessages();
}, 60000);

// ─── INIT ────────────────────────────────────────────────
injectChatStyles();

document.addEventListener("DOMContentLoaded", () => {
  injectChatStyles();
  setTimeout(enhanceChatUI, 500);
  autoDayNightTheme();
  updateStreak();
});

