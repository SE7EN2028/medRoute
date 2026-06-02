<div align="center">

# MedRoute

**Describe how you feel. Get routed to the right care — calmly, with clear next steps.**

</div>

---

## What it does

MedRoute reads described symptoms and routes user to one of three flows:

| Flow | What user sees |
|---|---|
| **Emergency** | Red triage screen, first-aid steps, 108 dial, nearest ERs |
| **Urgent / Routine** | Suggested specialty, nearby hospitals, cost estimates |
| **Blood Donation** | Camp locator, calendar reminders |

Designed to feel **calm, not clinical**. Soft typography, generous spacing, warm greens — red only where it must be.

---

## Stack

- **React Native + Expo** — cross-platform, runs in Expo Go
- **TypeScript** — strict mode
- **NativeWind** — Tailwind classes for styling
- **Zustand** — state management
- **Groq LLM** — symptom understanding
- **OpenStreetMap (Overpass)** — hospital lookup (free, no key)

---

## Quick start

```bash
npm install
npx expo start
```

Scan QR with Expo Go (iOS / Android).

In app: **Profile tab → API keys → paste Groq key**.

> App runs without keys too — UI works, emergency safety net works offline.

---

## API keys

| Service | Where | Required |
|---|---|---|
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Yes |
| OpenStreetMap | Built-in, no signup | No |

---

## What's real vs. mocked

| Area | Status |
|---|---|
| Symptom triage | Real (Groq) |
| Hospital lookup | Real (OpenStreetMap) |
| Distance | Real (user location) |
| Calendar reminders | Real |
| Share with loved one | Real (WhatsApp + native share) |
| Cost estimates | Mocked (sample INR ranges) |
| Blood camps | Mocked (sample Indian camps) |
| Auth / users | Not implemented |

---

## Safety

- Disclaimers shown 3x: first-run, results screen, emergency screen
- Emergency keyword safety net works even without Groq
- App is informational only — not a substitute for medical advice
- In emergencies → **call 108**

---

## Accessibility

- Big touch targets
- Screen-reader labels on every button
- High contrast on emergency screen

---

## Roadmap

- Backend with user auth
- Real blood-camp feed (eRaktKosh)
- Insurance / government scheme matcher
- Telemedicine integration
- Triage history
- Hindi + regional languages

---

## Scripts

```bash
npm run start      # expo start
npm run android    # run on Android
npm run ios        # run on iOS
npm run web        # run on web
npm run typecheck  # tsc --noEmit
```

---
