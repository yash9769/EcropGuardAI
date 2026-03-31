# eCropGuard AI 🌿

An AI-powered crop disease identification app for farmers, built with React + Vite + TypeScript + Capacitor.

## Features

- 📸 **Camera & Gallery** — Capture or upload crop images for instant analysis
- 🤖 **Google Gemini AI** — Advanced multimodal AI diagnoses diseases with high accuracy
- 🌍 **Multilingual** — Supports English, Hindi, Marathi, and 6 more Indian languages
- 📊 **Detailed Reports** — Symptoms, causes, treatment steps, and prevention tips
- 💾 **Scan History** — Supabase-backed history with offline guest mode
- 📱 **Mobile First** — Capacitor-powered Android app with native camera support
- 🔐 **Auth + Guest Mode** — Sign in with email or use without an account

## Stack

| Layer | Tech |
|-------|------|
| UI Framework | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Build Tool | Vite 6 |
| AI | Google Gemini 2.0 Flash |
| Backend | Supabase (Auth + Postgres) |
| Mobile | Capacitor 8 |
| i18n | i18next |
| Icons | Lucide React |

## Setup

### 1. Clone & Install
```bash
git clone <repo>
cd ecropguard-ai
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` with your keys:
- `VITE_GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/app/apikey)
- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Your Supabase anon key

### 3. Set Up Database
Run `database_setup.sql` in your Supabase SQL editor.

### 4. Run Dev Server
```bash
npm run dev
```

## Android Build

```bash
npm run build
npm run cap:sync
npm run cap:open   # Opens in Android Studio
```

## Design System

The app uses a dark organic theme:
- **Font**: Syne (display) + DM Sans (body)
- **Primary**: `#4ade80` green with glow effects
- **Background**: Deep forest `#060d06`
- **Cards**: Glassmorphism with subtle borders
- **Animations**: Fade-up, scale-in, pulse rings, scan line

## Languages Supported

English · Hindi · Marathi · Punjabi · Telugu · Tamil · Kannada · Gujarati · Bengali

## License

MIT
