# 💕 Babe Betu

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-naincykit.onrender.com-ff4d8d?style=for-the-badge)](https://naincykit.onrender.com)

### This is for you, my dear girlfriend 💕

## About

**Babe Betu** (shown in-app as *NainKit*) is a private, password-protected website built as a gift — a single-page little world with photos, music, a running "days together" counter, and a handful of small interactive surprises along the way. No frameworks, no build step: just hand-written HTML, CSS, and JavaScript.

## ✨ Features

- 🔐 **Password-gated entry** with an animated starry welcome screen and a confetti burst on unlock
- 🌌 **Animated cosmic background** — drifting gradient orbs with mouse parallax, plus softly floating hearts
- ⏱️ **Live "days together" counter**, ticking up in real time down to the second
- 📖 **Love timeline** of key chapters, revealed as you scroll
- 🖼️ **Polaroid photo gallery** and an auto-playing **slideshow**, both with click-to-zoom
- 💌 **Love notes** and a signed special message
- 🎵 **Custom music player** — playlist, shuffle, repeat, volume, and a draggable seek bar
- 💬 **Live chat**, synced in real time through Firebase Realtime Database
- 🌗 **Light / dark theme toggle** that remembers your choice
- ✨ **Custom animated cursor** — a glowing dot with a trailing ring that reacts to hover and click, plus a soft sparkle trail
- 📱 Fully responsive, and respects `prefers-reduced-motion` for accessibility

## 🛠️ Tech Stack

| | |
|---|---|
| Markup / Styling | HTML5, CSS3 — custom properties, glassmorphism, keyframe animations |
| Logic | Vanilla JavaScript (ES6+), no framework |
| Realtime chat | Firebase Realtime Database |
| Fonts / Icons | Google Fonts (Playfair Display, DM Sans, Dancing Script), Font Awesome |
| Analytics | Google Analytics |
| Hosting | [Render](https://render.com) |

## 📁 Project Structure

```
babe-betu/
├── index.html         # Markup for every section
├── style.css           # All styling — theme colors live in :root CSS variables
├── script.js            # Interactions, animations, counter & the music player
├── live-chat.js         # Firebase-powered live chat
├── images/               # Photos used across the hero, gallery & slideshow
├── package.json           # Firebase dependency
└── .gitignore
```

## 🚀 Running It Locally

This is a static site, so there's no build step.

```bash
git clone https://github.com/eddiebrock911/babe-betu.git
cd babe-betu
```

## 🎨 Making It Your Own

This project doubles as a template for "build one of these for someone you love." A few places to look if you're customizing it:

| Want to change... | Edit... |
|---|---|
| The entry password | `CORRECT_PASSWORD` in `script.js` |
| The "together since" date | `START_DATE` in `script.js` |
| Photos | Swap files in `images/` and update the matching `src` paths in `index.html` |
| The playlist | The `PLAYLIST` array in `script.js` |
| Colors & theme | The CSS variables at the top of `style.css` (`:root`) |
| Timeline, notes & the special message | Their sections in `index.html` |

## 📄 License

No formal license yet — this one was built for an audience of one. If it inspired you, feel free to fork it and build your own version for someone special. 💕

---

<p align="center">Made with 💕</p>
