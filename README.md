# MailScope — Email & Domain Verification Platform

**MailScope** is a web-based email and domain verification platform designed to help users assess email address validity and domain readiness through structured verification checks. It provides a simple interface for submitting email addresses and reviewing verification results, with an emphasis on performance, security, and clear error handling.

🌐 **Live Demo:** https://mailscope-516v.onrender.com

📂 **GitHub Repository:** https://github.com/harikrishna901/MailScope

---

## 🚀 Project Overview

MailScope helps users evaluate email addresses and their associated domains using verification checks such as domain validation and DNS/MX record lookups. The platform is built with a React frontend and an Express backend, providing a responsive user interface and a structured API for processing verification requests.

The project demonstrates full-stack development skills, REST API design, backend validation, security middleware, rate limiting, and deployment of a Node.js application.

## ✨ Key Features

- **Email Verification:** Submit email addresses for verification checks.
- **Domain Validation:** Evaluate domain-related information as part of the verification process.
- **DNS & MX Record Checks:** Check domain DNS information and mail-exchange records.
- **Batch Processing Support:** Configurable batch-processing limit for verification requests.
- **REST API:** Backend API endpoints for verification operations.
- **Rate Limiting:** Helps protect verification endpoints from excessive requests.
- **Security Middleware:** Uses Helmet to set HTTP security headers.
- **Input Handling & Error Responses:** Structured API responses for errors and unknown endpoints.
- **Responsive Frontend:** React-based interface built with Vite.
- **Production Deployment:** Deployed as a web service on Render.

> **Note:** SMTP-based mailbox probing is currently disabled in the deployed configuration. DNS/MX checks do not, by themselves, confirm that a mailbox exists or can receive email.

## 🛠️ Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Security | Helmet, CORS, Express Rate Limit |
| Validation | Zod |
| UI & Visualization | Tailwind CSS, Lucide React, Recharts, Motion |
| Testing | Vitest, Node.js test runner |
| Deployment | Render |
| Version Control | Git, GitHub |

## 🏗️ Architecture

```text
User
  |
  v
React Frontend
  |
  v
Express REST API
  |
  v
Request Validation & Rate Limiting
  |
  v
Email / Domain Verification Service
  |
  v
DNS & MX Record Checks
  |
  v
Structured Verification Results
```

## ⚙️ Run Locally

### Prerequisites

- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/harikrishna901/MailScope.git
cd MailScope
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and configure the variables supported by the application.

Example:

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000
SMTP_ENABLED=false
MAX_BATCH=100
DOMAIN_AUTH_ENABLED=true
```

Adjust the port and other settings to match your local configuration. Keep credentials and secrets private, and never commit your `.env` file.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL configured for your development server, typically:

```text
http://localhost:3000
```

### 5. Build for production

```bash
npm run build
```

### 6. Run tests

```bash
npm test
```

## 🌐 Deployment

MailScope is deployed on **Render**.

- **Live Application:** https://mailscope-516v.onrender.com
- **Health Endpoint:** https://mailscope-516v.onrender.com/api/health

The application uses a Node.js web service to serve the backend API and production frontend assets.

*Note: On Render's free tier, the service may take some time to respond after a period of inactivity.*

## 🔒 Security Considerations

- Rate limiting is applied to verification requests.
- Helmet adds HTTP security headers.
- CORS controls which origins can access the API from browsers.
- Request body size is limited to reduce oversized payloads.
- Environment variables are used for deployment configuration.

## 🎯 Learning Outcomes

This project demonstrates practical experience with:

- Full-stack application development using React and Express.
- Building and organizing REST APIs.
- Implementing security middleware and rate limiting.
- Performing DNS-based domain verification.
- Managing environment-specific configuration.
- Testing backend functionality.
- Deploying a full-stack application to a cloud hosting platform.

## 👨‍💻 Author

**Hari Krishna Golla**

GitHub: [harikrishna901](https://github.com/harikrishna901)

---

*MailScope — Simplifying email and domain verification through a clean, structured web experience.*

