/* ============================================
   LIVE CHAT — Firebase Realtime Database
   Project: naincyKit
   Advanced UI polish + presence + messages
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

// Ask for name once, remember it on this device
let myName = localStorage.getItem("chatName");
if (!myName) {
  myName = (prompt("What is your name? (Ankit or Naincy):") || "Guest").trim();
  if (!myName) myName = "Guest";
  localStorage.setItem("chatName", myName);
}

const chatRef = db.ref("messages");
const presenceRef = db.ref("presence/" + myName);

// Presence heartbeat
presenceRef.set({ online: true, lastSeen: Date.now() });
presenceRef.onDisconnect().set({ online: false, lastSeen: Date.now() });

// Refresh presence every 30s while tab is open
setInterval(() => {
  presenceRef.update({ online: true, lastSeen: Date.now() });
}, 30000);

function toggleChat() {
  const box = document.getElementById("chat-box");
  if (!box) return;
  box.classList.toggle("open");
  if (box.classList.contains("open")) {
    const input = document.getElementById("chat-input");
    if (input) setTimeout(() => input.focus(), 200);
    // mark as read / scroll
    const messagesDiv = document.getElementById("chat-messages");
    if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
}

function sendMessage() {
  const input = document.getElementById("chat-input");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  chatRef.push({
    text: text.slice(0, 500),
    sender: myName,
    timestamp: Date.now()
  });
  input.value = "";
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

chatRef.limitToLast(50).on("value", (snapshot) => {
  const messagesDiv = document.getElementById("chat-messages");
  if (!messagesDiv) return;

  const wasNearBottom =
    messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 80;

  messagesDiv.innerHTML = "";
  const data = snapshot.val();
  if (!data) {
    messagesDiv.innerHTML =
      '<p style="text-align:center;color:rgba(255,255,255,0.35);font-size:0.85rem;padding:24px 12px;font-weight:300">No messages yet… say something sweet 💕</p>';
    return;
  }

  Object.values(data)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .forEach((msg) => {
      const div = document.createElement("div");
      const isMe = msg.sender === myName;
      div.className = "msg " + (isMe ? "me" : "them");

      if (!isMe && msg.sender) {
        const senderEl = document.createElement("div");
        senderEl.className = "msg-sender";
        senderEl.textContent = msg.sender;
        div.appendChild(senderEl);
      }

      const textNode = document.createElement("div");
      textNode.textContent = msg.text || "";
      div.appendChild(textNode);

      const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
      });
      const timeEl = document.createElement("div");
      timeEl.className = "msg-time";
      timeEl.textContent = time;
      div.appendChild(timeEl);

      messagesDiv.appendChild(div);
    });

  if (wasNearBottom) {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
});

// Online status for the other person
db.ref("presence").on("value", (snapshot) => {
  const data = snapshot.val() || {};
  const statusEl = document.getElementById("online-status");
  if (!statusEl) return;

  const others = Object.keys(data).filter((name) => name !== myName);
  const onlineOther = others.find((name) => data[name] && data[name].online);

  if (onlineOther) {
    statusEl.textContent = onlineOther + " is online";
  } else if (others.length) {
    const last = others[0];
    statusEl.textContent = last + " is offline";
  } else {
    statusEl.textContent = "waiting for partner…";
  }
});

// Expose for inline handlers
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
