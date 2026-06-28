# Suara - Voice-First Accessibility Layer for Ride & Food Ordering

![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-blue)
![React Native](https://img.shields.io/badge/mobile-React%20Native%20%2F%20Expo-61dafb?logo=react)
![NestJS](https://img.shields.io/badge/api-NestJS-e0234e?logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%2016-4169e1?logo=postgresql)
![Docker](https://img.shields.io/badge/infra-Docker-2496ed?logo=docker)
![License](https://img.shields.io/badge/license-MIT-green)

**Demo video:** [Watch on Google Drive](https://drive.google.com/file/d/1qo7MGT0IAun_8y6bPcdFEbHB1JCKI2ZX/view?usp=drive_link)

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Features](#features)
- [Tech Stack and Architecture](#tech-stack-and-architecture)
- [Setup and Installation](#setup-and-installation)
- [Run Instructions](#run-instructions)
- [User Guide](#user-guide)
- [AI Disclosure](#ai-disclosure)
- [Attribution and License](#attribution-and-license)

---

## Problem Statement

Ride-hailing and food-delivery apps in Vietnam — Grab, Be, Xanh SM, Shopee Food — were built for sighted users navigating dense, tap-heavy interfaces. For Vietnam's estimated **6.2 million people with disabilities**, particularly those with visual or motor impairments, completing even a basic task requires reading small-print pricing, precise touch gestures, and navigating multiple confirmation dialogs that screen readers handle inconsistently.

The root cause is structural: these platforms surface their complexity at the interaction layer rather than abstracting it. The result is practical exclusion from services that have become essential urban infrastructure.

---

## Solution Overview

Suara is a voice-first accessibility layer that sits between the user and multiple ordering platforms. Through a single conversational interface, users can book rides or order food across Grab, Be, Xanh SM, and Shopee Food — entirely by voice.

A spoken request flows through the backend pipeline: Speech-to-Text transcription, NLU intent and slot extraction, partner API validation, and Natural Language Generation that speaks a confirmation back. The AI speaks first on every turn. No forms, no tap sequences.

---

## Features

**Voice-First Ordering** — Users complete a full ride or food order through spoken Vietnamese. A floating microphone button is globally accessible from every screen.

**Multi-Platform Support** — A single session routes to Grab, Be, Xanh SM, or Shopee Food. Each partner is abstracted behind a common adapter; the user states their preference once.

**AI Validation Layer** — Before confirming any order, the NLU layer checks for missing slots (destination, item, quantity, address) and asks targeted clarifying questions rather than failing silently.

**Conversational Session State** — Server-side sessions track intent, collected slots, and conversation history across turns. Users can change their destination, swap a menu item, or cancel mid-flow without starting over.

**Accessibility Flag** — Orders originating from an accessibility flow are flagged on the order record, enabling future partner-side accommodations such as extended boarding time notifications.

**Pluggable Providers** — Every external dependency (STT, NLU, Places, Weather, Partner APIs) is injected via a named provider token. Switching from mock to live requires only an environment variable change.

---

## Tech Stack and Architecture

| Layer | Technology |
|---|---|
| Mobile client | React Native (Expo SDK 52), TypeScript |
| Navigation | React Navigation v7 |
| Voice input | `expo-speech-recognition` |
| Voice output | `expo-speech` |
| API framework | NestJS 11, TypeScript |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| Containerisation | Docker, Docker Compose |
| Reverse proxy | nginx |

**Monorepo structure:**

```
voice-mobility/
├── apps/
│   ├── api/src/
│   │   ├── voice/          # STT → NLU → NLG → TTS pipeline
│   │   ├── voice-flow/     # Multi-turn session orchestration
│   │   ├── orders/         # Order lifecycle
│   │   ├── partners/       # Grab / Be / Xanh SM / Shopee adapters
│   │   └── restaurants/    # Menu + search
│   └── mobile/src/
│       ├── screens/        # S01_Splash … S17_OrderHistory
│       ├── components/     # FloatingMicButton, VoiceOverlay, …
│       └── contexts/       # VoiceContext (global mic state)
└── docker-compose.yml
```

The mobile app posts audio or transcript to `POST /voice/turn`. The NestJS backend resolves intent, queries the relevant partner adapter, and returns an NLG text response. Session state is persisted in PostgreSQL via Prisma.

---

## Setup and Installation

**Prerequisites:** Node.js 20+, Docker and Docker Compose, Expo CLI (`npm install -g expo-cli`), Android or iOS device or emulator.

**Dependency files included in this repository:**

| File | Location |
|---|---|
| `package.json` | `apps/api/` and `apps/mobile/` |
| `.env.example` | `apps/api/.env.example` — all required environment variables documented |

**1. Clone the repository**

```bash
git clone <repository-url>
cd voice-mobility
```

**2. Configure the API**

```bash
cd apps/api
cp .env.example .env
```

Key variables in `.env`:

```env
DATABASE_URL=postgresql://vmuser:vmpass@localhost:5432/voice_mobility

# Set to "mock" to run fully offline — no external API keys needed
PROVIDER_STT=mock        # mock | deepgram | azure
PROVIDER_NLU=mock        # mock | openrouter
PROVIDER_PLACES=db       # db | mock | google | serpapi
PROVIDER_WEATHER=mock    # mock | open-meteo
PROVIDER_PARTNER=db      # db | live

# Only required when using live providers
OPENROUTER_API_KEY=
GOOGLE_PLACES_API_KEY=
DEEPGRAM_API_KEY=
```

**3. Install dependencies**

```bash
# API
cd apps/api && npm install

# Mobile
cd apps/mobile && npm install
```

**4. Point the mobile app at your API**

In `apps/mobile/app.json`, set `extra.apiUrl` to your machine's LAN IP (not `localhost`) when testing on a physical device:

```json
"extra": { "apiUrl": "http://YOUR_LAN_IP:3000" }
```

---

## Run Instructions

**API via Docker (recommended)**

```bash
# From apps/api/
docker compose up --build
```

The entrypoint script runs `prisma db push` and seeds the database automatically on first start. API is available at `http://localhost:3000`.

**API without Docker**

```bash
cd apps/api
npm run prisma:setup   # migrate + seed
npm run start:dev
```

**Mobile app**

```bash
cd apps/mobile
npx expo start         # scan QR with Expo Go
```

**Tests**

```bash
cd apps/api
npm run test           # unit
npm run test:e2e       # end-to-end
npm run test:cov       # coverage
```

---

## User Guide

1. Launch the app. After connecting your account, a floating green microphone button is visible on every screen.
2. Tap the mic. The AI greets you and asks whether you want to book a ride or order food.
3. Speak your request in Vietnamese — for example, "Dat xe den Benh vien Bach Mai" or "Goi mot pho bo tren Grab".
4. If any detail is missing, the AI asks one follow-up question. It will never ask you to repeat information already given.
5. The AI reads back an order summary and asks for verbal confirmation. Say "Xac nhan" to confirm.
6. You are taken to the tracking screen. After delivery, the AI offers to collect a voice rating for the restaurant and driver.

To change or cancel mid-flow, say "Doi" followed by what to change, or "Huy" to cancel.

---

## AI Disclosure

This project was developed with AI assistance.

| Tool | Usage |
|---|---|
| Claude (Anthropic) | Architecture design, NestJS module generation, React Native screen scaffolding, Prisma schema, voice flow prompt engineering |
| GitHub Copilot | In-editor code completion |

All AI-generated code was reviewed, tested, and modified by the development team before being committed.

---

## Attribution and License

Third-party dependencies used in this project include NestJS (MIT), Expo / React Native (MIT), Prisma (Apache 2.0), React Navigation (MIT), and expo-speech-recognition (MIT). Refer to the `package.json` in each app directory for the full dependency list.

This project is licensed under the MIT License. See `apps/mobile/LICENSE` for the full text.
