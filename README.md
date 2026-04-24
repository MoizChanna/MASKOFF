# MASKOFF — Social Deduction Party Game

> Everyone's hiding something.

MASKOFF is a mobile-first multiplayer social deduction party game built with **React + Vite + Firebase Firestore** — completely free to run forever on the Firebase free tier.

---

## Quick Start

### 1. Clone & install

```bash
cd "D:/Code/Portfolio Apps/MASKOFF"
npm install
```

### 2. Set up Firebase (free)

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → give it any name → disable Google Analytics → Create
3. In your project: **Project Settings → Your Apps → Add App → Web (</>) **
4. Register your app, copy the config values
5. In the left sidebar: **Build → Firestore Database → Create database**
   - Choose **Start in test mode** (change rules before going public)
   - Pick any region → Enable
6. Copy `.env.example` → `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Firestore Security Rules (recommended)

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomCode} {
      allow read, write: if true; // tighten before production
    }
  }
}
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (free)

1. Push your code to GitHub (don't commit `.env`)
2. Go to [https://vercel.com](https://vercel.com) → New Project → Import repo
3. Set **Framework Preset** to `Vite`
4. Add all `VITE_FIREBASE_*` env vars in Vercel's **Environment Variables** settings
5. Deploy — done!

---

## Project Structure

```
MASKOFF/
├── public/
│   └── favicon.svg
├── src/
│   ├── firebase/
│   │   ├── config.js         # Firebase init
│   │   └── gameService.js    # All Firestore read/write logic
│   ├── hooks/
│   │   ├── useRoom.js        # Realtime room subscription
│   │   └── useSound.js       # Sound hook (console.log placeholders)
│   ├── screens/
│   │   ├── HomeScreen.jsx
│   │   ├── CreateRoomScreen.jsx
│   │   ├── LobbyScreen.jsx
│   │   ├── RoleRevealScreen.jsx
│   │   ├── GameScreen.jsx
│   │   ├── VotingScreen.jsx
│   │   └── EndScreen.jsx
│   ├── styles/
│   │   └── global.css        # Full theme, animations, layout
│   ├── utils/
│   │   ├── wordPairs.js      # 50+ asset/ghost word pairs
│   │   ├── roomUtils.js      # Room code generation, role assignment
│   ├── App.jsx               # Route definitions
│   └── main.jsx              # Entry point
├── .env.example
├── .gitignore
├── .nvmrc                    # Node 20
├── index.html
├── package.json
└── vite.config.js
```

---

## How to Play

| Role | Word | Win Condition |
|------|------|---------------|
| **ASSET** | Real word | Eliminate all Ghosts |
| **GHOST** | Similar but different word | Survive to the end, or guess the Asset word when eliminated |
| **VOID** | No word | Survive and correctly guess the word at the end |

1. **Host** creates a room and shares the 4-letter code
2. Everyone joins on their own phone (or pass one phone around)
3. Phone gets passed for **Role Reveal** — each player secretly sees their dossier
4. Each round: everyone gives a **one-word clue** about their word
5. **Vote** to eliminate the most suspicious player
6. Repeat until a win condition is met

---

## Tech Stack

- **React 18** + **Vite 5**
- **Firebase Firestore** (realtime via `onSnapshot`)
- **React Router v6**
- **Google Fonts** — Syne 800 + DM Mono
- Zero paid APIs — runs free forever on Firebase Spark plan

---

## Adding Real Sounds

Replace `console.log` stubs in `src/hooks/useSound.js` with your preferred audio library (e.g. Howler.js). Sound events:

- `playSound('reveal')` — card flip on role reveal
- `playSound('stamp')` — clue submitted / vote cast
- `playSound('eliminate')` — elimination stamp slams in
- `playSound('win')` — end screen win
