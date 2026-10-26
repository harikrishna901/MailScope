# Mailscope: Email Deliverability Intelligence Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#testing)
[![Tests](https://img.shields.io/badge/tests-passed-brightgreen)](#testing)
[![Node](https://img.shields.io/badge/node-%3E%3D20-blue)](#tech-stack)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

> **Live Application URL:** `[YOUR_DEPLOYED_URL_HERE]`  
> **GitHub Repository:** `[YOUR_GITHUB_REPO_URL_HERE]`

Mailscope is an evidence-based email deliverability intelligence platform built on the principle of **honest uncertainty**. Instead of assigning fabricated "reputation scores" or guaranteeing delivery rates, Mailscope evaluates syntax compliance, resolves DNS and Mail Exchange (MX) records, and performs non-intrusive SMTP recipient probes to give you objective, auditable technical evidence.

---

## Strict Operational Invariants

1. **Zero Email Sent:** Mailscope never issues the SMTP `DATA` command. It connects to the mail exchanger, performs an `EHLO` and `MAIL FROM`/`RCPT TO` inquiry, and immediately issues `QUIT`. No emails are sent, queued, or delivered.
2. **100% In-Memory Processing:** Email addresses are processed transiently in server memory and garbage-collected immediately. No database, logs, or persistent caches store user address lists.
3. **No Third-Party APIs:** Email addresses are never submitted to commercial third-party validation APIs or resold to data brokers.
4. **Honest Uncertainty:** If mail routing exists but live recipient verification cannot be performed (or returns greylisting/catch-all), the address is classified as **Unknown**, never as an unsubstantiated "valid".
5. **Signals Never Mutate Classification:** Advisory flags (typo suggestions, role addresses, disposable domains, and SPF/DMARC status) provide hygiene context but **never** alter the core deliverability classification (`likely_deliverable`, `likely_bounce`, `unknown`).

---

## Features

- **Practical Syntax RFC Validation:** Enforces RFC 5321/5322 limits (254-character maximum, 64-character local part, dot placement rules, forbidden characters, and non-numeric TLDs).
- **DNS & RFC 7505 Null MX Detection:** Resolves MX records sorted by priority, detects explicit null MX records (`0 .`) rejecting all email, and falls back to implicit A/AAAA mail routing per RFC 5321 Section 5.1.
- **Safe SMTP Recipient Verification (Optional):** When enabled, checks mail server response codes (2xx, 4xx, 5xx) and enhanced status codes (5.1.1 through 5.1.6).
- **Catch-All Mail Server Detection:** Probes a pseudo-random non-existent address on accepted domains to detect catch-all servers and flag them as `Unknown`.
- **Typo Detection & 1-Click Fix:** Employs the Damerau-Levenshtein distance metric and common TLD typo rules (`.con`, `.cmo`, etc.) to suggest intended domains (e.g. `gmial.com` → `gmail.com`).
- **Role & Disposable Flags:** Flags departmental role mailboxes (`admin@`, `support@`) and throwaway disposable domains without altering the technical deliverability classification.
- **Domain Email-Authentication (SPF & DMARC):** Opt-in DNS lookups inspect SPF (`v=spf1`) and DMARC policies (`p=reject`, `p=quarantine`, `p=none`).
- **Inconclusive Result Re-Checking:** Re-tests `unknown` results with 1-click in-place merging, respecting a 3-round retry limit to prevent greylisting hammering.
- **Printable Executive Summary Report:** Dedicated `@media print` layout formatting verification KPIs, high-level findings, optional full address registers, and standard legal disclaimers.
- **Pre-Flight Client Deduplication:** Deduplicates case-insensitively, preserves original casing, and shows counts before submission.
- **Protected CSV Export:** Generates RFC 4180 CSV exports with formula injection neutralization (prefixes cells starting with `=`, `+`, `-`, `@` with an apostrophe `'`).

---

## The 3 Classifications & 7 Decision Rules

Each address is evaluated through a strict rule hierarchy where the **first matching rule wins**:

| Order | Condition Trigger | Status | Description |
|---|---|---|---|
| **Rule 1** | Syntax Invalid | **Likely to Bounce** | Violates RFC length, dot placement, or characters |
| **Rule 2** | MX Status is `none` | **Likely to Bounce** | Domain has no MX or A records, or publishes RFC 7505 Null MX |
| **Rule 3** | MX `lookup_failed` | **Unknown** | DNS resolver timed out or SERVFAIL; not proof of a bounce |
| **Rule 4** | SMTP `rejected_permanent` | **Likely to Bounce** | Mail server explicitly issued 550 / 5.1.1 recipient rejection |
| **Rule 5** | SMTP `catch_all` | **Unknown** | Server accepts all recipients; individual existence cannot be confirmed |
| **Rule 6** | SMTP `accepted` | **Likely Deliverable** | Server issued 250 OK (positive evidence, not an inbox guarantee) |
| **Rule 7** | All other conditions | **Unknown** | Greylisting (4xx), policy block, unreachable, or probe skipped |

---

## Tech Stack

- **Backend:** Node.js (v20+), Express, TypeScript (ESM), Zod, `express-rate-limit`, `cors`, `helmet`, native `node:dns/promises` and `node:net`.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Motion.
- **Testing:** Node.js built-in test runner (`node:test`, `node:assert/strict`) and Vitest.

---

## Local Setup

### 1. Clone the repository
```bash
git clone [YOUR_GITHUB_REPO_URL_HERE]
cd mailscope
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```

Default configuration (`.env`):
```ini
PORT=3000
CORS_ORIGIN=http://localhost:3000
SMTP_ENABLED=false
SMTP_TIMEOUT_MS=8000
SMTP_HELO_HOST=mailscope.internal
SMTP_MAIL_FROM=probe@mailscope.internal
MAX_BATCH=100
DOMAIN_AUTH_ENABLED=true
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing

Run the automated test suite covering syntax rules, DNS resolution, SMTP probes, the 7-rule classification table, typo matching, role/disposable detection, SPF/DMARC resolution, and CSV formula neutralization:

```bash
npm test
```

---

## API Documentation

All API responses follow a consistent JSON envelope:
- Success: `{ "ok": true, "data": ... }`
- Failure: `{ "ok": false, "error": { "code": "...", "message": "..." } }`

### 1. Health Check
```bash
curl -X GET http://localhost:3000/api/health
```
```json
{
  "ok": true,
  "data": { "status": "healthy" }
}
```

### 2. Public Configuration
```bash
curl -X GET http://localhost:3000/api/config
```
```json
{
  "ok": true,
  "data": {
    "maxBatch": 100,
    "smtpEnabled": false,
    "domainAuthEnabled": true
  }
}
```

### 3. Verify Email Batch with Informational Signals
```bash
curl -X POST http://localhost:3000/api/check \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      "alex@stripe.com",
      "sarah@gmial.com",
      "billing@nullmx-test.invalid"
    ],
    "options": {
      "domainAuth": true
    }
  }'
```

---

## Deployment (Render Web Service)

This repository includes a `render.yaml` blueprint configured for free-tier deployment as a single full-stack web service:

### Step-by-Step Deployment:
1. Push your repository to GitHub.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint** and connect your GitHub repository (or choose **Web Service**).
4. Configure Build and Start commands:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
5. Ensure environment variable `SMTP_ENABLED=false` is set.
6. Click **Deploy**. Once deployed, verify `/api/health` returns `200 OK`.

### Note on Port 25 in Cloud Environments
Most cloud hosting platforms (Render, AWS, GCP, Azure, DigitalOcean) block outbound traffic on TCP port 25 to prevent spam abuse. `SMTP_ENABLED=false` is the safe, recommended default in production. In this mode, syntax validation, DNS/MX lookup, and Null MX detection function at full capacity, with inconclusive addresses accurately classified as **Unknown**.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
