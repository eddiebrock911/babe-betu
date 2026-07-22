/* ============================================
   LIVE CHAT — Firebase Realtime Database
   Project: naincyKit
   Upgraded: Typing, Reactions, Emoji, Sounds,
   Read Receipts, Delete, Last Seen, Love Rain
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ─── USER IDENTITY ────────────────────────────────────────
let myName = localStorage.getItem("chatName");
if (!myName) {
  myName = (prompt("What is your name? (Ankit or Naincy):") || "Guest").trim();
  if (!myName) myName = "Guest";
  localStorage.setItem("chatName", myName);
}

// Unique device session ID for read receipts
let myDeviceId = localStorage.getItem("chatDeviceId");
if (!myDeviceId) {
  myDeviceId = myName + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  localStorage.setItem("chatDeviceId", myDeviceId);
}

const chatRef = db.ref("messages");
const typingRef = db.ref("typing/" + myName);
const presenceRef = db.ref("presence/" + myName);

// Track last message we've read
let lastReadMsgKey = localStorage.getItem("chatLastRead") || "";
let chatSoundEnabled = localStorage.getItem("chatSound") !== "off";
let myMsgKeys = new Set(); // Track our own message keys for delete

// ─── PRESENCE HEARTBEAT ───────────────────────────────────
presenceRef.set({ online: true, lastSeen: Date.now(), name: myName });
presenceRef.onDisconnect().set({ online: false, lastSeen: Date.now(), name: myName });

setInterval(() => {
  presenceRef.update({ online: true, lastSeen: Date.now() });
}, 30000);

// Clear typing on disconnect too
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

    // Sweet two-tone chime
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    // Silent fail
  }
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
  box.classList.toggle("open");

  if (box.classList.contains("open")) {
    const input = document.getElementById("chat-input");
    if (input) setTimeout(() => input.focus(), 200);

    const messagesDiv = document.getElementById("chat-messages");
    if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Mark all as read when opening chat
    markAllAsRead();

    // Clear notification badge
    const badge = document.querySelector(".chat-notif-badge");
    if (badge) badge.remove();
  }
}

// ─── MARK ALL AS READ ────────────────────────────────────
function markAllAsRead() {
  chatRef.limitToLast(1).once("value", (snap) => {
    const data = snap.val();
    if (data) {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        lastReadMsgKey = keys[keys.length - 1];
        localStorage.setItem("chatLastRead", lastReadMsgKey);
      }
    }
  });
}

// ─── SEND MESSAGE ────────────────────────────────────────
function sendMessage() {
  const input = document.getElementById("chat-input");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  // Clear typing indicator
  typingRef.set(false);

  const msgData = {
    text: text.slice(0, 500),
    sender: myName,
    timestamp: Date.now(),
    deviceId: myDeviceId,
    read: false
  };

  chatRef.push(msgData);
  input.value = "";

  // Play send sound
  playSendSound();

  // 💕 Love Rain — if message contains love keywords
  const lower = text.toLowerCase();
  if (
    lower.includes("i love you") ||
    lower.includes("love you") ||
    lower.includes("i love u") ||
    lower.includes("miss you") ||
    lower.includes("love u") ||
    lower.includes("ily") ||
    lower.includes("❤️❤️❤️") ||
    lower.includes("💕💕💕")
  ) {
    triggerLoveRain();
  }
}

// ─── DELETE MESSAGE ──────────────────────────────────────
function deleteMessage(key) {
  if (!key) return;
  if (!confirm("Delete this message?")) return;
  chatRef.child(key).remove();
}

// ─── REACT TO MESSAGE ────────────────────────────────────
function reactToMessage(key, emoji) {
  if (!key) return;
  const reactRef = db.ref("reactions/" + key);
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
  d.textContent = str;
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

  // Update toggle button
  const toggleBtn = document.getElementById("chat-emoji-toggle");
  if (toggleBtn) toggleBtn.classList.toggle("active", emojiPickerOpen);
}

// ─── REACTION PICKER (popup near message) ────────────────
let activeReactionPicker = null;

function showReactionPicker(msgKey, anchorEl) {
  // Remove existing picker
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

  // Position using FIXED coordinates on body (does NOT touch chat box position)
  const rect = anchorEl.getBoundingClientRect();
  const pickerWidth = reactions.length * 38 + 24; // approximate

  // Horizontal: align to message left, but keep within viewport
  let leftPos = rect.left;
  if (leftPos + pickerWidth > window.innerWidth - 12) {
    leftPos = window.innerWidth - pickerWidth - 12;
  }
  if (leftPos < 8) leftPos = 8;

  // Vertical: above the message. If not enough space, below it
  let topPos = rect.top - 52;
  if (topPos < 8) topPos = rect.bottom + 8;

  picker.style.position = "fixed";
  picker.style.left = leftPos + "px";
  picker.style.top = topPos + "px";
  picker.style.zIndex = "11000";

  // Append to body so it doesn't affect chat box layout at all
  document.body.appendChild(picker);
  activeReactionPicker = picker;

  // Close on outside click
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

// ─── QUICK ROMANTIC REPLIES ──────────────────────────────
const QUICK_REPLIES = [
  "I love you 💕",
  "Miss you 🥺",
  "Good morning ☀️",
  "Good night 🌙",
  "You're the best 🥰",
  "Thinking of you 💭",
  "Hugs 🤗",
  "😘😘😘"
];

function buildQuickReplies() {
  let container = document.getElementById("chat-quick-replies");
  if (!container) {
    container = document.createElement("div");
    container.id = "chat-quick-replies";
    container.className = "chat-quick-replies";

    QUICK_REPLIES.forEach((reply) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-quick-btn";
      btn.textContent = reply;
      btn.addEventListener("click", () => {
        const input = document.getElementById("chat-input");
        if (input) {
          input.value = reply;
          sendMessage();
        }
      });
      container.appendChild(btn);
    });

    const inputRow = document.querySelector(".chat-input-row");
    if (inputRow) inputRow.parentElement.insertBefore(container, inputRow);
  }
}

// ─── RENDER MESSAGES ─────────────────────────────────────
let lastMsgCount = 0;
let allReactions = {};

// Listen for reactions separately
db.ref("reactions").on("value", (snap) => {
  allReactions = snap.val() || {};
  // Re-render if chat is open
  const box = document.getElementById("chat-box");
  if (box && box.classList.contains("open")) {
    // Light re-render (just update reaction badges)
    updateReactionBadges();
  }
});

function updateReactionBadges() {
  document.querySelectorAll(".msg[data-key]").forEach((msgEl) => {
    const key = msgEl.dataset.key;
    const reactions = allReactions[key];
    let badgeContainer = msgEl.querySelector(".msg-reactions");

    if (reactions) {
      // Group by emoji
      const emojiCounts = {};
      Object.values(reactions).forEach((r) => {
        if (r.emoji) {
          emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
        }
      });

      if (!badgeContainer) {
        badgeContainer = document.createElement("div");
        badgeContainer.className = "msg-reactions";
        msgEl.appendChild(badgeContainer);
      }

      badgeContainer.innerHTML = Object.entries(emojiCounts)
        .map(
          ([emoji, count]) =>
            `<span class="msg-reaction-badge">${emoji}${count > 1 ? " " + count : ""}</span>`
        )
        .join("");
    } else if (badgeContainer) {
      badgeContainer.remove();
    }
  });
}

chatRef.limitToLast(80).on("value", (snapshot) => {
  const messagesDiv = document.getElementById("chat-messages");
  if (!messagesDiv) return;

  const wasNearBottom =
    messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 80;

  messagesDiv.innerHTML = "";
  const data = snapshot.val();

  if (!data) {
    messagesDiv.innerHTML =
      '<div class="chat-empty-state"><span class="chat-empty-icon">💌</span><p>No messages yet…<br>say something sweet 💕</p></div>';
    return;
  }

  const keys = Object.keys(data);
  const sortedKeys = keys.sort((a, b) => (data[a].timestamp || 0) - (data[b].timestamp || 0));
  const newMsgCount = sortedKeys.length;

  // Check for unread messages (for sound + badge)
  let unreadCount = 0;

  sortedKeys.forEach((key, index) => {
    const msg = data[key];
    const div = document.createElement("div");
    const isMe = msg.sender === myName;
    div.className = "msg " + (isMe ? "me" : "them");
    div.dataset.key = key;

    // Track our own messages
    if (isMe) myMsgKeys.add(key);

    // Check if unread (not from me and after last read)
    if (!isMe && key > lastReadMsgKey) {
      unreadCount++;
    }

    // Sender name (for their messages)
    if (!isMe && msg.sender) {
      const senderEl = document.createElement("div");
      senderEl.className = "msg-sender";
      senderEl.textContent = msg.sender;
      div.appendChild(senderEl);
    }

    // Message text
    const textNode = document.createElement("div");
    textNode.className = "msg-text";
    textNode.textContent = msg.text || "";
    div.appendChild(textNode);

    // Bottom row: time + status + actions
    const bottomRow = document.createElement("div");
    bottomRow.className = "msg-bottom";

    // Time
    const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
    const timeEl = document.createElement("span");
    timeEl.className = "msg-time";
    timeEl.textContent = time;
    bottomRow.appendChild(timeEl);

    // Read receipt (for our messages)
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

    // ─── ACTIONS (on hover/long-press) ───
    const actionsEl = document.createElement("div");
    actionsEl.className = "msg-actions";

    // React button
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

    // Delete button (only for own messages)
    if (isMe) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "msg-action-btn msg-action-delete";
      delBtn.innerHTML = "🗑️";
      delBtn.title = "Delete";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteMessage(key);
      });
      actionsEl.appendChild(delBtn);
    }

    div.appendChild(actionsEl);

    // ─── REACTIONS DISPLAY ───
    const reactions = allReactions[key];
    if (reactions) {
      const emojiCounts = {};
      Object.values(reactions).forEach((r) => {
        if (r.emoji) {
          emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
        }
      });

      if (Object.keys(emojiCounts).length > 0) {
        const reactionsEl = document.createElement("div");
        reactionsEl.className = "msg-reactions";
        reactionsEl.innerHTML = Object.entries(emojiCounts)
          .map(
            ([emoji, count]) =>
              `<span class="msg-reaction-badge">${emoji}${count > 1 ? " " + count : ""}</span>`
          )
          .join("");
        div.appendChild(reactionsEl);
      }
    }

    messagesDiv.appendChild(div);
  });

  // Sound for new incoming messages
  if (newMsgCount > lastMsgCount && lastMsgCount > 0) {
    const latestMsg = data[sortedKeys[sortedKeys.length - 1]];
    if (latestMsg && latestMsg.sender !== myName) {
      playMsgSound();

      // If chat is not open, show notification badge
      const box = document.getElementById("chat-box");
      if (!box || !box.classList.contains("open")) {
        showNotifBadge(unreadCount);
      }
    }
  }
  lastMsgCount = newMsgCount;

  if (wasNearBottom) {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Auto mark as read if chat is open
  const box = document.getElementById("chat-box");
  if (box && box.classList.contains("open") && sortedKeys.length > 0) {
    const newLastKey = sortedKeys[sortedKeys.length - 1];
    if (newLastKey !== lastReadMsgKey) {
      lastReadMsgKey = newLastKey;
      localStorage.setItem("chatLastRead", lastReadMsgKey);
    }
  }
});

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

// ─── MARK MESSAGES AS READ (Firebase update) ─────────────
// Periodically mark messages from the other person as read
setInterval(() => {
  const box = document.getElementById("chat-box");
  if (!box || !box.classList.contains("open")) return;

  chatRef
    .orderByChild("read")
    .equalTo(false)
    .limitToLast(20)
    .once("value", (snap) => {
      const data = snap.val();
      if (!data) return;
      Object.entries(data).forEach(([key, msg]) => {
        if (msg.sender !== myName && !msg.read) {
          chatRef.child(key).update({ read: true });
        }
      });
    });
}, 3000);

// ─── TYPING INDICATOR ────────────────────────────────────
const chatInput = document.getElementById("chat-input");
let typingTimeout = null;

if (chatInput) {
  chatInput.addEventListener("input", () => {
    // Set typing = true
    typingRef.set(true);

    // Clear after 2s of no typing
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      typingRef.set(false);
    }, 2000);
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      typingRef.set(false);
    }
  });
}

// Listen for other person's typing
db.ref("typing").on("value", (snap) => {
  const data = snap.val() || {};
  const typingIndicator = document.getElementById("chat-typing");

  // Find who else is typing
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

// ─── INJECT CHAT UI ENHANCEMENTS ─────────────────────────
function enhanceChatUI() {
  const chatBox = document.getElementById("chat-box");
  if (!chatBox) return;

  // Add typing indicator element
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

  // Add emoji toggle button to input row
  const inputRow = document.querySelector(".chat-input-row");
  if (inputRow && !document.getElementById("chat-emoji-toggle")) {
    const emojiBtn = document.createElement("button");
    emojiBtn.type = "button";
    emojiBtn.id = "chat-emoji-toggle";
    emojiBtn.className = "chat-extra-btn";
    emojiBtn.textContent = "😊";
    emojiBtn.title = "Emoji";
    emojiBtn.addEventListener("click", toggleEmojiPicker);
    inputRow.insertBefore(emojiBtn, inputRow.firstChild);
  }

  // Add sound toggle to chat header
  const chatHeader = chatBox.querySelector(".chat-header");
  if (chatHeader && !document.getElementById("chat-sound-toggle")) {
    const soundBtn = document.createElement("button");
    soundBtn.type = "button";
    soundBtn.id = "chat-sound-toggle";
    soundBtn.className = "chat-header-btn";
    soundBtn.textContent = chatSoundEnabled ? "🔔" : "🔕";
    soundBtn.title = chatSoundEnabled ? "Sound On" : "Sound Off";
    soundBtn.addEventListener("click", toggleChatSound);

    const closeBtn = chatHeader.querySelector(".chat-close");
    if (closeBtn) {
      chatHeader.insertBefore(soundBtn, closeBtn);
    }
  }

  // Build quick replies
  buildQuickReplies();
}

// ─── EXPOSE FOR INLINE HANDLERS ──────────────────────────
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.toggleEmojiPicker = toggleEmojiPicker;
window.toggleChatSound = toggleChatSound;
window.deleteMessage = deleteMessage;
window.reactToMessage = reactToMessage;

// ─── INIT ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Small delay to ensure chat HTML is ready
  setTimeout(enhanceChatUI, 500);
});
