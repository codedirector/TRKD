# Trackd — Git-Style Resume Version Control & Recruiter Telemetry

<p align="center">
  <img src="./public/favicon.svg" width="96" height="96" alt="Trackd Logo" />
</p>

<p align="center">
  <strong>Stop sending static documents into the void. Track what matters, see what changed, and know when your resume is getting real recruiter attention.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20%2B-green.svg?style=flat-square" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-19-blue.svg?style=flat-square" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue.svg?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=flat-square" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Vite-v6-purple.svg?style=flat-square" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-black.svg?style=flat-square" alt="License" />
</p>

---

## ⚡ Overview

**Trackd** brings the developer experience of Git to resumes, CVs, portfolios, and proposals. Instead of emailing `Resume_Final_v3_REAL.pdf`, Trackd gives candidates a single, permanent public URL with full revision history, instant rollback, access PIN security, and silent recruiter telemetry.

### ✨ Key Features

- **🏷️ Git-Style Version Control:**
  - Semantic version labeling (`v1.0`, `v1.1`, `v2.0`).
  - Conventional commit messages (e.g. `feat(experience): quantify backend metrics`).
  - Safe rollbacks: revert to any past commit without losing historical audit logs (creates a forward release commit).
  - GitHub-style contribution activity grid.

- **🕵️‍♂️ Silent Recruiter Telemetry & Analytics:**
  - Instant view counters (Total Views vs. Unique Visitors).
  - Recruiter reading time and duration tracking via session heartbeat.
  - PDF download events and QR code scan tracking.
  - Analytics dashboard with charts (device breakdown, engagement timelines via Recharts).

- **🔗 Permanent Public URLs & Direct Sharing:**
  - Canonical personal links: `/@username/document-slug` or short tokens `/view/:token`.
  - Update your resume without invalidating links previously submitted on job boards or LinkedIn.
  - Built-in QR Code generator with one-click PNG download.

- **🔒 Access PIN Security:**
  - Secure sensitive documents, confidential portfolios, or proposals with an optional 4–6 digit Access PIN.
  - Salted SHA-256 hashed verification before document preview or download.

- **🛡️ Strict PDF Security:**
  - Binary magic-byte (`%PDF-`) verification on uploads to prevent malformed or spoofed files.
  - Safe inline streaming headers (`Content-Disposition: inline`, `Cross-Origin-Resource-Policy`).
  - Strict 404 interceptors ensuring PDF endpoints never leak HTML SPA fallbacks.

- **💳 Pro Entitlements & Billing:**
  - Free & Pro tiers with instant 7-day Pro trial toggle.
  - Pro features: watermark removal, unlimited repositories, advanced telemetry.
  - Built-in Razorpay checkout supporting both live payment processing and an instant Sandbox Simulator.

- **🔋 Dual Persistence & Zero-Dependency Local Setup:**
  - **Local Out-of-the-Box:** Runs with local JSON persistence (`data/db.json`) and local disk storage (`uploads/`). No third-party accounts required to run locally.
  - **Cloud Scale Ready:** Seamlessly connects to MongoDB Atlas and Cloudinary media storage when environment variables are supplied.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons, Recharts.
- **Backend:** Node.js, Express, TypeScript (`tsx` runtime), `pdf-lib`, `bcryptjs`, `qrcode`.
- **Database:** Resilient Dual Engine — MongoDB Atlas with automatic in-memory hydration, backed by local JSON storage fallback.
- **Media Storage:** Cloudinary cloud storage with automatic local filesystem fallback.
- **Authentication:** Dual Mode — Built-in bcrypt + JWT standalone auth, plus Clerk Auth integration.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- `npm`, `pnpm`, or `bun`

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/trackd-resume-version-control.git
cd trackd-resume-version-control
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment (Optional)
Trackd is designed to run immediately without any configuration. To enable optional cloud services (MongoDB Atlas, Cloudinary, Gemini AI, Clerk, Razorpay):

```bash
cp .env.example .env
```

### 4. Run in Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build & Deployment

### Build Frontend and Server
```bash
npm run build
```
This compiles the React 19 frontend into `dist/` via Vite and bundles the Node.js Express server into `dist/server.cjs` via esbuild.

### Run Production Server
```bash
npm start
```

---

## ⚙️ Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | Optional | Port to bind the HTTP server (default: `3000`). |
| `APP_URL` | Optional | Public base URL for canonical sharing links (e.g. `https://trackd.yourdomain.com`). |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI commit generation. (Heuristic fallback active if omitted). |
| `MONGODB_URI` | Optional | MongoDB Atlas connection string (`mongodb+srv://...`). (Local JSON fallback active if omitted). |
| `MONGODB_DB_NAME` | Optional | MongoDB database name (default: `trackd`). |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name for remote PDF storage. (Local disk fallback active if omitted). |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API Key. |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API Secret. |
| `RAZORPAY_KEY_ID` | Optional | Razorpay key ID for subscriptions. (Sandbox simulator active if omitted). |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay key secret for HMAC SHA256 signature verification. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Optional | Clerk publishable key for managed user identity. (Standalone auth active if omitted). |
| `CLERK_SECRET_KEY` | Optional | Clerk secret key for authoritative backend token verification. |

---

## 🧪 Testing & Verification

Run the TypeScript type check:
```bash
npm run lint
```

Run the automated integration and regression test suite:
```bash
npm test
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
