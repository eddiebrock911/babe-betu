/* ============================================
   LIVE CHAT — Firebase Realtime Database
   Project: naincyKit
   ============================================ */

// Your actual Firebase config (already filled in)
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
let myName = localStorage.getItem('chatName');
if (!myName) {
  myName = prompt("Tumhara naam likho (Ankit ya Naincy):") || "Guest";
  localStorage.setItem('chatName', myName);
}

const chatRef = db.ref('messages');
const presenceRef = db.ref('presence/' + myName);

presenceRef.set({ online: true, lastSeen: Date.now() });
presenceRef.onDisconnect().set({ online: false, lastSeen: Date.now() });

function toggleChat() {
  document.getElementById('chat-box').classList.toggle('open');
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  chatRef.push({
    text,
    sender: myName,
    timestamp: Date.now()
  });
  input.value = '';
}

chatRef.limitToLast(50).on('value', (snapshot) => {
  const messagesDiv = document.getElementById('chat-messages');
  if (!messagesDiv) return;
  messagesDiv.innerHTML = '';
  const data = snapshot.val();
  if (!data) return;

  Object.values(data).forEach(msg => {
    const div = document.createElement('div');
    const isMe = msg.sender === myName;
    div.className = 'msg ' + (isMe ? 'me' : 'them');
    div.textContent = msg.text;

    const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const timeEl = document.createElement('div');
    timeEl.className = 'msg-time';
    timeEl.textContent = time;
    div.appendChild(timeEl);

    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Show whether the other person is online
db.ref('presence').on('value', (snapshot) => {
  const data = snapshot.val() || {};
  const otherPerson = Object.keys(data).find(name => name !== myName);
  const statusEl = document.getElementById('online-status');
  if (!statusEl) return;
  if (otherPerson && data[otherPerson].online) {
    statusEl.textContent = otherPerson + ' is online';
  } else if (otherPerson) {
    statusEl.textContent = otherPerson + ' is offline';
  } else {
    statusEl.textContent = 'waiting...';
  }
});