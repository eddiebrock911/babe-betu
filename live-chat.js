/* ============================================
   LIVE CHAT — Firebase Realtime Database
   Project: naincyKit
   Upgraded: Typing, Reactions, Emoji, Sounds,
   Read Receipts, Delete, Last Seen, Love Rain
   ============================================ */

(function () {
  "use strict";

  // ─── FIREBASE CONFIG ─────────────────────────────────────
  var firebaseConfig = {
    apiKey: "AIzaSyBGj9MkqAOUvGox8MEsaz7vPUOwQbAref4",
    authDomain: "naincykit.firebaseapp.com",
    databaseURL: "https://naincykit-default-rtdb.firebaseio.com",
    projectId: "naincykit",
    storageBucket: "naincykit.firebasestorage.app",
    messagingSenderId: "401758447692",
    appId: "1:401758447692:web:8928284aa8f7552290ece9"
  };

  // Initialize Firebase (only if not already initialized)
  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  var db = firebase.database();

  // ─── USER IDENTITY ───────────────────────────────────────
  var myName = localStorage.getItem("chatName");
  if (!myName) {
    myName = (prompt("What is your name? (Ankit or Naincy):") || "Guest").trim();
    if (!myName) myName = "Guest";
    localStorage.setItem("chatName", myName);
  }

  var myDeviceId = localStorage.getItem("chatDeviceId");
  if (!myDeviceId) {
    myDeviceId = myName + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    localStorage.setItem("chatDeviceId", myDeviceId);
  }

  var chatRef = db.ref("messages");
  var typingRef = db.ref("typing/" + myName);
  var presenceRef = db.ref("presence/" + myName);

  // State
  var lastReadMsgKey = localStorage.getItem("chatLastRead") || "";
  var chatSoundEnabled = localStorage.getItem("chatSound") !== "off";
  var lastMsgCount = 0;
  var allReactions = {};
  var typingTimeout = null;
  var emojiPickerBuilt = false;

  // ─── PRESENCE HEARTBEAT ──────────────────────────────────
  try {
    presenceRef.set({ online: true, lastSeen: Date.now(), name: myName });
    presenceRef.onDisconnect().set({ online: false, lastSeen: Date.now(), name: myName });

    setInterval(function () {
      presenceRef.update({ online: true, lastSeen: Date.now() });
    }, 30000);

    typingRef.onDisconnect().set(false);
  } catch (e) {
    console.warn("Presence setup failed:", e);
  }

  // ─── CHAT SOUND (Web Audio) ─────────────────────────────
  var audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    return audioCtx;
  }

  function playMsgSound() {
    if (!chatSoundEnabled) return;
    try {
      var ctx = getAudioCtx();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  function playSendSound() {
    if (!chatSoundEnabled) return;
    try {
      var ctx = getAudioCtx();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  // ─── TOGGLE CHAT BOX ────────────────────────────────────
  function toggleChat() {
    var box = document.getElementById("chat-box");
    if (!box) return;
    box.classList.toggle("open");

    if (box.classList.contains("open")) {
      var input = document.getElementById("chat-input");
      if (input) setTimeout(function () { input.focus(); }, 200);

      var messagesDiv = document.getElementById("chat-messages");
      if (messagesDiv) {
        setTimeout(function () {
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }, 100);
      }

      markAllAsRead();

      // Clear notification badge
      var badge = document.querySelector(".chat-notif-badge");
      if (badge) badge.style.display = "none";
    }
  }

  // ─── MARK ALL AS READ ───────────────────────────────────
  function markAllAsRead() {
    chatRef.limitToLast(1).once("value", function (snap) {
      var data = snap.val();
      if (data) {
        var keys = Object.keys(data);
        if (keys.length > 0) {
          lastReadMsgKey = keys[keys.length - 1];
          localStorage.setItem("chatLastRead", lastReadMsgKey);
        }
      }
    });
  }

  // ─── SEND MESSAGE ───────────────────────────────────────
  function sendMessage() {
    var input = document.getElementById("chat-input");
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;

    typingRef.set(false);

    chatRef.push({
      text: text.slice(0, 500),
      sender: myName,
      timestamp: Date.now(),
      deviceId: myDeviceId,
      read: false
    });

    input.value = "";
    playSendSound();

    // Love Rain trigger
    var lower = text.toLowerCase();
    if (
      lower.indexOf("i love you") !== -1 ||
      lower.indexOf("love you") !== -1 ||
      lower.indexOf("i love u") !== -1 ||
      lower.indexOf("miss you") !== -1 ||
      lower.indexOf("love u") !== -1 ||
      lower === "ily" ||
      lower.indexOf("\u2764\uFE0F\u2764\uFE0F\u2764\uFE0F") !== -1 ||
      lower.indexOf("\uD83D\uDC95\uD83D\uDC95\uD83D\uDC95") !== -1
    ) {
      triggerLoveRain();
    }

    // Close emoji picker if open
    var picker = document.getElementById("chat-emoji-picker");
    if (picker) picker.classList.remove("open");
    var toggleBtn = document.getElementById("chat-emoji-toggle");
    if (toggleBtn) toggleBtn.classList.remove("active");
  }

  // ─── SEND QUICK REPLY ──────────────────────────────────
  function sendQuickReply(text) {
    if (!text) return;
    typingRef.set(false);
    chatRef.push({
      text: text.slice(0, 500),
      sender: myName,
      timestamp: Date.now(),
      deviceId: myDeviceId,
      read: false
    });
    playSendSound();

    var lower = text.toLowerCase();
    if (lower.indexOf("love you") !== -1 || lower.indexOf("miss you") !== -1) {
      triggerLoveRain();
    }
  }

  // ─── DELETE MESSAGE ─────────────────────────────────────
  function deleteMessage(key) {
    if (!key) return;
    if (!confirm("Delete this message?")) return;
    chatRef.child(key).remove();
    // Also remove reactions
    try { db.ref("reactions/" + key).remove(); } catch (e) {}
  }

  // ─── REACT TO MESSAGE ──────────────────────────────────
  function reactToMessage(key, emoji) {
    if (!key || !emoji) return;
    db.ref("reactions/" + key).child(myName).set({
      emoji: emoji,
      timestamp: Date.now()
    });
  }

  // ─── LOVE RAIN EFFECT ──────────────────────────────────
  function triggerLoveRain() {
    var container = document.getElementById("chat-messages");
    if (!container) return;

    var hearts = ["💕", "💗", "💖", "❤️", "💝", "💘", "🌹", "✨", "💫", "🦋"];
    for (var i = 0; i < 20; i++) {
      var h = document.createElement("span");
      h.className = "chat-love-rain-heart";
      h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      h.style.left = Math.random() * 100 + "%";
      h.style.setProperty("--lr-dur", (1.5 + Math.random() * 1.5) + "s");
      h.style.setProperty("--lr-delay", (Math.random() * 0.5) + "s");
      h.style.setProperty("--lr-size", (14 + Math.random() * 14) + "px");
      h.style.setProperty("--lr-drift", (-30 + Math.random() * 60) + "px");
      container.appendChild(h);
      (function (el) {
        setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 3500);
      })(h);
    }
  }

  // ─── TIME AGO ──────────────────────────────────────────
  function timeAgo(timestamp) {
    var diff = Date.now() - timestamp;
    var secs = Math.floor(diff / 1000);
    if (secs < 60) return "just now";
    var mins = Math.floor(secs / 60);
    if (mins < 60) return mins + "m ago";
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    var days = Math.floor(hrs / 24);
    return days + "d ago";
  }

  // ─── EMOJI PICKER ──────────────────────────────────────
  var CHAT_EMOJIS = [
    "❤️", "💕", "💗", "😍", "🥰", "😘", "💋", "🤗",
    "😊", "😂", "🥺", "😢", "😭", "🙈", "💪", "👏",
    "🔥", "✨", "💫", "🌸", "🌹", "🦋", "👑", "💯",
    "🎉", "🎊", "☕", "📚", "⚖️", "💝", "🫶", "😏"
  ];

  function buildEmojiPicker() {
    if (emojiPickerBuilt) return;
    var picker = document.getElementById("chat-emoji-picker");
    if (!picker) return;
    emojiPickerBuilt = true;

    CHAT_EMOJIS.forEach(function (emoji) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-emoji-btn";
      btn.textContent = emoji;
      btn.addEventListener("click", function () {
        var input = document.getElementById("chat-input");
        if (input) {
          input.value += emoji;
          input.focus();
        }
      });
      picker.appendChild(btn);
    });
  }

  function toggleEmojiPicker() {
    buildEmojiPicker();
    var picker = document.getElementById("chat-emoji-picker");
    var toggleBtn = document.getElementById("chat-emoji-toggle");
    if (picker) {
      picker.classList.toggle("open");
      if (toggleBtn) toggleBtn.classList.toggle("active", picker.classList.contains("open"));
    }
  }

  // ─── REACTION PICKER ───────────────────────────────────
  var activeReactionPicker = null;

  function showReactionPicker(msgKey, anchorEl) {
    if (activeReactionPicker) {
      if (activeReactionPicker.parentNode) activeReactionPicker.parentNode.removeChild(activeReactionPicker);
      activeReactionPicker = null;
    }

    var picker = document.createElement("div");
    picker.className = "chat-reaction-picker";

    var reactions = ["❤️", "😂", "😍", "🥰", "👏", "🔥", "💕", "😢"];
    reactions.forEach(function (emoji) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = emoji;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        reactToMessage(msgKey, emoji);
        if (picker.parentNode) picker.parentNode.removeChild(picker);
        activeReactionPicker = null;
      });
      picker.appendChild(btn);
    });

    var chatBox = document.getElementById("chat-box");
    if (chatBox && anchorEl) {
      var rect = anchorEl.getBoundingClientRect();
      var chatRect = chatBox.getBoundingClientRect();
      picker.style.position = "absolute";
      picker.style.left = Math.max(4, Math.min(rect.left - chatRect.left, chatRect.width - 290)) + "px";
      picker.style.top = Math.max(4, rect.top - chatRect.top - 48) + "px";
      chatBox.style.position = "relative";
      chatBox.appendChild(picker);
      activeReactionPicker = picker;

      setTimeout(function () {
        document.addEventListener("click", closeReactionPicker, { once: true });
      }, 10);
    }
  }

  function closeReactionPicker() {
    if (activeReactionPicker) {
      if (activeReactionPicker.parentNode) activeReactionPicker.parentNode.removeChild(activeReactionPicker);
      activeReactionPicker = null;
    }
  }

  // ─── NOTIFICATION BADGE ────────────────────────────────
  function showNotifBadge(count) {
    var toggleBtn = document.getElementById("chat-toggle-btn");
    if (!toggleBtn) return;

    var badge = toggleBtn.querySelector(".chat-notif-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "chat-notif-badge";
      toggleBtn.appendChild(badge);
    }
    badge.textContent = count > 9 ? "9+" : String(count);
    badge.style.display = count > 0 ? "flex" : "none";
  }

  // ─── SOUND TOGGLE ─────────────────────────────────────
  function toggleChatSound() {
    chatSoundEnabled = !chatSoundEnabled;
    localStorage.setItem("chatSound", chatSoundEnabled ? "on" : "off");
    var btn = document.getElementById("chat-sound-toggle");
    if (btn) {
      btn.textContent = chatSoundEnabled ? "🔔" : "🔕";
      btn.title = chatSoundEnabled ? "Sound On" : "Sound Off";
    }
  }

  // ─── RENDER MESSAGES ──────────────────────────────────
  chatRef.limitToLast(80).on("value", function (snapshot) {
    var messagesDiv = document.getElementById("chat-messages");
    if (!messagesDiv) return;

    var wasNearBottom =
      messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 80;

    messagesDiv.innerHTML = "";
    var data = snapshot.val();

    if (!data) {
      messagesDiv.innerHTML =
        '<div class="chat-empty-state"><span class="chat-empty-icon">💌</span><p>No messages yet…<br>say something sweet 💕</p></div>';
      return;
    }

    var keys = Object.keys(data);
    keys.sort(function (a, b) {
      return (data[a].timestamp || 0) - (data[b].timestamp || 0);
    });

    var newMsgCount = keys.length;
    var unreadCount = 0;

    keys.forEach(function (key) {
      var msg = data[key];
      var div = document.createElement("div");
      var isMe = msg.sender === myName;
      div.className = "msg " + (isMe ? "me" : "them");
      div.setAttribute("data-key", key);

      if (!isMe && key > lastReadMsgKey) {
        unreadCount++;
      }

      // Sender
      if (!isMe && msg.sender) {
        var senderEl = document.createElement("div");
        senderEl.className = "msg-sender";
        senderEl.textContent = msg.sender;
        div.appendChild(senderEl);
      }

      // Text
      var textNode = document.createElement("div");
      textNode.className = "msg-text";
      textNode.textContent = msg.text || "";
      div.appendChild(textNode);

      // Bottom row
      var bottomRow = document.createElement("div");
      bottomRow.className = "msg-bottom";

      var time = new Date(msg.timestamp || Date.now()).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
      });
      var timeEl = document.createElement("span");
      timeEl.className = "msg-time";
      timeEl.textContent = time;
      bottomRow.appendChild(timeEl);

      if (isMe) {
        var statusEl = document.createElement("span");
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

      // Actions (hover)
      var actionsEl = document.createElement("div");
      actionsEl.className = "msg-actions";

      var reactBtn = document.createElement("button");
      reactBtn.type = "button";
      reactBtn.className = "msg-action-btn";
      reactBtn.innerHTML = "😊";
      reactBtn.title = "React";
      (function (k, d) {
        reactBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          showReactionPicker(k, d);
        });
      })(key, div);
      actionsEl.appendChild(reactBtn);

      if (isMe) {
        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "msg-action-btn msg-action-delete";
        delBtn.innerHTML = "🗑️";
        delBtn.title = "Delete";
        (function (k) {
          delBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            deleteMessage(k);
          });
        })(key);
        actionsEl.appendChild(delBtn);
      }

      div.appendChild(actionsEl);

      // Reactions display
      var reactions = allReactions[key];
      if (reactions) {
        var emojiCounts = {};
        var reactionValues = Object.values(reactions);
        reactionValues.forEach(function (r) {
          if (r && r.emoji) {
            emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
          }
        });

        var emojiKeys = Object.keys(emojiCounts);
        if (emojiKeys.length > 0) {
          var reactionsEl = document.createElement("div");
          reactionsEl.className = "msg-reactions";
          emojiKeys.forEach(function (emoji) {
            var badge = document.createElement("span");
            badge.className = "msg-reaction-badge";
            badge.textContent = emoji + (emojiCounts[emoji] > 1 ? " " + emojiCounts[emoji] : "");
            reactionsEl.appendChild(badge);
          });
          div.appendChild(reactionsEl);
        }
      }

      messagesDiv.appendChild(div);
    });

    // Sound for new messages
    if (newMsgCount > lastMsgCount && lastMsgCount > 0) {
      var latestMsg = data[keys[keys.length - 1]];
      if (latestMsg && latestMsg.sender !== myName) {
        playMsgSound();
        var box = document.getElementById("chat-box");
        if (!box || !box.classList.contains("open")) {
          showNotifBadge(unreadCount);
        }
      }
    }
    lastMsgCount = newMsgCount;

    if (wasNearBottom) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Auto mark as read
    var box = document.getElementById("chat-box");
    if (box && box.classList.contains("open") && keys.length > 0) {
      var newLastKey = keys[keys.length - 1];
      if (newLastKey !== lastReadMsgKey) {
        lastReadMsgKey = newLastKey;
        localStorage.setItem("chatLastRead", lastReadMsgKey);
      }
    }
  });

  // ─── REACTIONS LISTENER ────────────────────────────────
  db.ref("reactions").on("value", function (snap) {
    allReactions = snap.val() || {};
  });

  // ─── MARK AS READ (background) ────────────────────────
  setInterval(function () {
    var box = document.getElementById("chat-box");
    if (!box || !box.classList.contains("open")) return;

    chatRef.limitToLast(20).once("value", function (snap) {
      var data = snap.val();
      if (!data) return;
      Object.keys(data).forEach(function (key) {
        var msg = data[key];
        if (msg.sender !== myName && !msg.read) {
          chatRef.child(key).update({ read: true });
        }
      });
    });
  }, 4000);

  // ─── TYPING INDICATOR ─────────────────────────────────
  function initTyping() {
    var input = document.getElementById("chat-input");
    if (!input) return;

    input.addEventListener("input", function () {
      typingRef.set(true);
      if (typingTimeout) clearTimeout(typingTimeout);
      typingTimeout = setTimeout(function () {
        typingRef.set(false);
      }, 2000);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        typingRef.set(false);
      }
    });
  }

  // Listen for others typing
  db.ref("typing").on("value", function (snap) {
    var data = snap.val() || {};
    var typingIndicator = document.getElementById("chat-typing");
    if (!typingIndicator) return;

    var typingOthers = [];
    Object.keys(data).forEach(function (name) {
      if (name !== myName && data[name] === true) {
        typingOthers.push(name);
      }
    });

    if (typingOthers.length > 0) {
      typingIndicator.innerHTML =
        '<span class="typing-dots"><span></span><span></span><span></span></span> ' +
        typingOthers.join(", ") + " is typing...";
      typingIndicator.classList.add("visible");
    } else {
      typingIndicator.classList.remove("visible");
    }
  });

  // ─── ONLINE STATUS + LAST SEEN ────────────────────────
  db.ref("presence").on("value", function (snapshot) {
    var data = snapshot.val() || {};
    var statusEl = document.getElementById("online-status");
    var dotEl = document.querySelector(".status-dot");
    if (!statusEl) return;

    var others = [];
    Object.keys(data).forEach(function (name) {
      if (name !== myName) others.push({ name: name, data: data[name] });
    });

    var onlineOther = null;
    others.forEach(function (o) {
      if (o.data && o.data.online) onlineOther = o;
    });

    if (onlineOther) {
      statusEl.textContent = onlineOther.name + " is online 💕";
      if (dotEl) {
        dotEl.style.background = "#4ade80";
        dotEl.style.boxShadow = "0 0 8px rgba(74, 222, 128, 0.6)";
      }
    } else if (others.length > 0) {
      var other = others[0];
      if (other.data && other.data.lastSeen) {
        statusEl.textContent = other.name + " · last seen " + timeAgo(other.data.lastSeen);
      } else {
        statusEl.textContent = other.name + " is offline";
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

  // ─── EXPOSE GLOBALS ───────────────────────────────────
  window.toggleChat = toggleChat;
  window.sendMessage = sendMessage;
  window.sendQuickReply = sendQuickReply;
  window.toggleEmojiPicker = toggleEmojiPicker;
  window.toggleChatSound = toggleChatSound;
  window.deleteMessage = deleteMessage;
  window.reactToMessage = reactToMessage;

  // ─── INIT ─────────────────────────────────────────────
  function init() {
    initTyping();
    buildEmojiPicker();

    // Restore sound button state
    var soundBtn = document.getElementById("chat-sound-toggle");
    if (soundBtn) {
      soundBtn.textContent = chatSoundEnabled ? "🔔" : "🔕";
      soundBtn.title = chatSoundEnabled ? "Sound On" : "Sound Off";
    }
  }

  // Run init when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
