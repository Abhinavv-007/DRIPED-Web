<!-- =====================================================================
     Driped — Stop the Drip · driped.in
     Subscription tracker that finds every recurring charge in your inbox.
     ===================================================================== -->

<div align="center">

<img src="public/driped-mark-2x.png" alt="Driped mark" width="120" />

# 💧 Driped &nbsp;·&nbsp; **Stop the Drip**

### Catch the drip. Cut the bills. <br/>Driped finds every recurring charge in your inbox and helps you cancel the ones you don't need.

<a href="https://driped.in"><img src="https://img.shields.io/badge/Live-driped.in-7C3AED?style=for-the-badge&logo=googlechrome&logoColor=white&labelColor=0a0a0a" alt="Live" /></a>
<a href="https://driped.in/download"><img src="https://img.shields.io/badge/Get%20the-Android%20App-3DDC84?style=for-the-badge&logo=android&logoColor=white&labelColor=0a0a0a" alt="Android app" /></a>
<a href="https://driped.in/onboarding"><img src="https://img.shields.io/badge/Connect-Your%20Inbox-7C3AED?style=for-the-badge&logo=gmail&logoColor=white&labelColor=0a0a0a" alt="Onboarding" /></a>

<br />

<a href="https://github.com/Abhinavv-007/DRIPED-Web/stargazers"><img src="https://img.shields.io/github/stars/Abhinavv-007/DRIPED-Web?style=flat-square&logo=github&color=7C3AED&labelColor=0a0a0a" alt="Stars" /></a>
<a href="https://github.com/Abhinavv-007/DRIPED-Web/commits/main"><img src="https://img.shields.io/github/last-commit/Abhinavv-007/DRIPED-Web?style=flat-square&logo=git&color=7C3AED&labelColor=0a0a0a" alt="Last commit" /></a>
<img src="https://img.shields.io/github/commit-activity/m/Abhinavv-007/DRIPED-Web?style=flat-square&logo=github&color=7C3AED&labelColor=0a0a0a" alt="Commit activity" />
<img src="https://img.shields.io/github/repo-size/Abhinavv-007/DRIPED-Web?style=flat-square&logo=files&color=7C3AED&labelColor=0a0a0a" alt="Repo size" />
<img src="https://img.shields.io/github/languages/top/Abhinavv-007/DRIPED-Web?style=flat-square&logo=typescript&color=7C3AED&labelColor=0a0a0a" alt="Top language" />
<img src="https://img.shields.io/github/v/tag/Abhinavv-007/DRIPED-Web?style=flat-square&logo=semver&color=7C3AED&labelColor=0a0a0a&label=version" alt="Version" />

<br/>

<sub>Stop letting subscriptions <i>drip</i> out of your account. Driped catches them, lines them up, and lets you axe the ones you forgot about.</sub>

</div>

<br/>

---

## ✦ The Drip Problem

> The average person leaks **$220+/year** to forgotten subscriptions — old streaming services, apps you tried once, free trials that quietly turned paid. Driped scans your inbox, recognises the recurring charges, normalises the amounts/cycles/merchants, and gives you a single command center to track and cancel them.

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>📥 Connect your inbox</h3>
      <p>OAuth into Gmail (read-only scope). Driped pulls billing-style emails and runs them through a deterministic parser that handles ~85% of merchants on its own — sender-domain map, regex templates, classifier, amount/date/cycle extractors.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🤖 AI fallback for the rest</h3>
      <p>Low-confidence or unknown-sender emails fall through to a cloud Llama&nbsp;3.1 8B Instruct worker on Cloudflare Workers AI. Sanitised body slices only. Cached per-email for 24 h. Rate-limited.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>📊 See every charge</h3>
      <p>Dashboard, analytics, forecast, categories, payments, savings, profile — every recurring expense lined up by next charge date. Sortable, filterable, time-traveled monthly views.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🪓 Cancel the drip</h3>
      <p>One-tap "Cancel this" links straight to the merchant's cancellation page where it exists, plus a curated "how to cancel" guide for the trickier ones.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🔐 Privacy first</h3>
      <p>Read-only Gmail scope. Email contents leave the device only when on-device parsing returns <code>overallConfidence&nbsp;&lt;&nbsp;70</code>. Even then, only a sanitised slice is sent. No per-user audit log retained.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🌗 Light + dark, every screen</h3>
      <p>Built with Next.js 16 + React 19 + Radix + shadcn + Tailwind 4. Theme persists across devices via Zustand storage. Cinematic motion via Framer.</p>
    </td>
  </tr>
</table>

---

## ✦ Architecture

```mermaid
flowchart LR
    User([User]) --> Web[driped.in<br/>Next.js 16 + React 19]
    Web --> Auth[Firebase Auth]
    Web --> Gmail[Gmail API<br/>read-only]
    Gmail --> Parser{Deterministic parser<br/>regex + classifier}
    Parser -->|confidence ≥ 70| Local[Render locally]
    Parser -->|confidence &lt; 70| API[POST api.driped.in/scan/extract]
    API --> CFAI[Cloudflare Workers AI<br/>Llama 3.1 8B Instruct]
    API --> KV[(KV cache · 24h)]
    Local --> UI[Dashboard · Analytics · Forecast · Categories · Payments]
    API --> UI
```

---

## ✦ Surfaces

| Route | Purpose |
| --- | --- |
| `/` | Marketing + dashboard entry |
| `/onboarding` | Inbox connect, scan progress, first-run wizard |
| `/connect` | Gmail OAuth handoff |
| `/(dashboard)/analytics` | Charts of monthly spend, category split |
| `/(dashboard)/categories` | Browse subscriptions by category |
| `/(dashboard)/forecast` | Cashflow forecast for the next 12 months |
| `/(dashboard)/payments` | Upcoming charges by date |
| `/(dashboard)/savings` | What you've saved by cancelling |
| `/(dashboard)/profile` | Account, plan, theme |
| `/(dashboard)/subscriptions` | Master list of every detected subscription |
| `/download` | Get the Driped Android app |

---

## ✦ Tech Stack

<p>
  <img src="https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind%204-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <br/>
  <img src="https://img.shields.io/badge/Radix%20UI-161618?style=for-the-badge&logo=radixui&logoColor=white" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" />
  <img src="https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" />
  <img src="https://img.shields.io/badge/Recharts-FF6B6B?style=for-the-badge&logo=chartdotjs&logoColor=white" />
  <br/>
  <img src="https://img.shields.io/badge/Zustand-FFB200?style=for-the-badge&logo=zustand&logoColor=black" />
  <img src="https://img.shields.io/badge/TanStack%20Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenNext-000000?style=for-the-badge&logo=cloudflare&logoColor=white" />
</p>

---

## ✦ Local Dev

```bash
git clone https://github.com/Abhinavv-007/DRIPED-Web.git
cd DRIPED-Web
npm install

# Copy and fill in the environment
cp .env.example .env.local

npm run dev           # http://localhost:3000
```

Lint:

```bash
npm run lint
```

Build (webpack):

```bash
npm run build
npm run start
```

Deploy to **Cloudflare Workers** (via OpenNext):

```bash
# wrangler is already a dev dep
npx wrangler --version
# build + deploy through @opennextjs/cloudflare per your routing config
```

---

## ✦ Project Layout

```text
DRIPED-Web/
├── src/
│   ├── app/
│   │   ├── (dashboard)/{analytics,categories,forecast,payments,profile,savings,subscriptions}
│   │   ├── connect/        # Gmail OAuth handoff
│   │   ├── onboarding/     # First-run scan wizard
│   │   ├── download/       # App download landing
│   │   ├── layout.tsx, page.tsx, globals.css
│   │   ├── icon.png, apple-icon.png, opengraph-image.png
│   ├── components/
│   │   ├── auth-gate.tsx, providers.tsx
│   │   ├── dashboard/, subscriptions/, shared/, ui/
│   └── lib/                # stores, helpers, parser glue
├── public/                 # driped-mark.png, brand-icons/* (per-merchant logos)
├── next.config.ts, tsconfig.json, eslint.config.mjs
└── components.json         # shadcn config
```

---

## ✦ The Mail Pipeline

> Two tiers, in order. Tier 1 wins ~85% of the time and stays on-device. Tier 2 only sees a sanitised slice.

| Tier | What runs | Where | Notes |
| --- | --- | --- | --- |
| 1 | `SubscriptionParser` + `@driped/scan` | On-device | Sender-domain map, merchant regex templates, classifier, amount / date / cycle extractors |
| 2 | Llama 3.1 8B Instruct via Cloudflare Workers AI | `POST https://api.driped.in/scan/extract` | Cached per-email in KV for 24 h. Rate-limited to **100 extractions / user / minute** |

Privacy guarantees:
- Email contents leave the device **only** when tier 1 returns `overallConfidence < 70`.
- Even then, only a sanitised body slice is sent.
- The Worker keeps **no per-user audit log**.

---

## ✦ Status & Versioning

| | |
|---|---|
| Production | [`driped.in`](https://driped.in) |
| Latest web release | <img src="https://img.shields.io/github/v/tag/Abhinavv-007/DRIPED-Web?style=flat-square&logo=semver&color=7C3AED&labelColor=0a0a0a&label=" valign="middle" /> |
| Web build | webpack via `next build --webpack` |
| Mobile companion | [DRIPED-Android](https://github.com/Abhinavv-007/DRIPED-Android) |

---

## ✦ Star History

<a href="https://star-history.com/#Abhinavv-007/DRIPED-Web&Date">
  <img src="https://api.star-history.com/svg?repos=Abhinavv-007/DRIPED-Web&type=Date" alt="Star history" width="100%" />
</a>

---

<div align="center">
  <sub>💧 Built by <a href="https://abhnv.in"><b>Abhinav Raj</b></a> — stop the drip.</sub>
  <br/>
  <a href="https://abhnv.in">Portfolio</a> · <a href="https://www.linkedin.com/in/abhnv07/">LinkedIn</a> · <a href="https://x.com/Abhnv007">X</a> · <a href="https://www.instagram.com/abhinavv.007/">Instagram</a>
</div>
