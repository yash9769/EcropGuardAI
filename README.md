# eCropGuard AI 🌿

[![Digital Agriculture](https://img.shields.io/badge/Focus-Smart_Farming-4ade80?style=for-the-badge&logoColor=white)](https://ecropguard.ai)
[![React](https://img.shields.io/badge/Frontend-React_19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Capacitor](https://img.shields.io/badge/Mobile-Capacitor_8-119eff?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-fdbf2d?style=for-the-badge)](./LICENSE)

**eCropGuard AI** is a premium, state-of-the-art agricultural diagnostic tool designed to empower farmers with instant, field-ready crop disease identification. By merging **local edge-AI inference** with **cloud-based Gemini intelligence**, it provides a robust fallback system that works even in low-connectivity rural environments.

---

## ✨ Key Features

### 🧠 Hybrid AI Core
- **Edge Inference (ONNX)**: Instant local analysis using hardware-optimized ResNet50 models. No data usage required for basic identification.
- **Cloud Intelligence (Gemini 2.0 Flash)**: Deep multimodal analysis provides detailed symptoms, causes, and step-by-step treatment protocols.
- **Noise Rejection Hardening**: Advanced pixel-variance, chroma-saturation, and logit-margin analysis filters out non-crop images (text, diagrams, domestic objects) to ensure diagnostic integrity.

### 🏠 Built for the Field
- **Multilingual Support**: Fully localized into 9 languages including **Hindi, Marathi, Punjabi, Telugu, Tamil, Kannada, Gujarati, and Bengali**.
- **Offline Scan History**: Supabase-backed persistent history with a fully functional **Guest Mode** for immediate utility without registration.
- **Native Experience**: Powered by **Capacitor 8**, offering a high-performance Android experience with native camera and gallery integration.

### 🎨 Premium Design System
- **Dark Organic Aesthetic**: A sleek "Deep Forest" theme (`#060d06`) with vibrant green accents and glassmorphism UI.
- **Responsive Motion**: Seamless fade-ups, pulse rings, and interactive scan lines powered by `motion`.

---

## 📈 Supported Crops & Diseases

| Crop | Target Diseases | Model Architecture |
| :--- | :--- | :--- |
| **Chickpea** | Wilt, Blight, Leaf Spot | ResNet50 (Quantized) |
| **Blackgram** | Anthracnose, Cercospora, Powdery Mildew, YMV | Custom CNN |
| **General** | Broad-spectrum detection | Gemini 2.0 Multimodal |

---

## 🛠️ Technology Stack

- **Core**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS v4 (Modern CSS-first configuration)
- **AI/ML**: ONNX Runtime Web (WASM) + Google Gemini API
- **Backend**: Supabase (Auth + Postgres + Row Level Security)
- **Mobile**: Capacitor 8 (Bio-metric ready)
- **Animation**: Motion (formerly Framer Motion)
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+
- Android Studio (for native builds)

### 2. Installation
```bash
git clone https://github.com/yash9769/EcropGuardAI.git
cd EcropGuardAI
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root:
```env
VITE_GEMINI_API_KEY=your_google_ai_studio_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Development
```bash
# Start Vite server
npm run dev
```

### 5. Mobile Deployment
```bash
# Build web assets
npm run build

# Sync and open in Android Studio
npm run cap:sync
npm run cap:open
```

---

## 📁 Project Structure

```text
ecropguard/
├── android/            # Native Android project (Capacitor)
├── public/
│   └── models/         # Trained ONNX models (chickpea, blackgram)
├── src/
│   ├── components/     # Reusable UI (Badges, Nav, Camera)
│   ├── lib/            # Core Logic (ONNX Inference, Supabase, Gemini)
│   ├── pages/          # App Views (Home, Scan, History, Auth)
│   └── i18n/           # Translation assets
├── database_setup.sql  # Supabase schema
└── package.json        # Dependencies & scripts
```

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ for the farming community.
</p>
