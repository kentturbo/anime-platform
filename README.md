# Anime Platform — Premium Content Subscription Platform

A premium, modern web application for a subscription-based anime streaming platform, featuring a stunning Glassmorphism UI (Apple-inspired aesthetic). The project includes a complete Express.js backend, a PostgreSQL database, a multi-step registration flow with email verification, JWT session management, and verification of Telegram channel membership prior to granting file access.

---

## 🎨 Interface Preview (Screenshots)

> [!NOTE]
> Below are placeholders for visual walkthroughs. Replace these with actual images when deployed.

| Page / State | Preview |
|---|---|
| **Main Landing Page** (Promo screen with glassmorphic layout) | ![Landing Page](screenshots/landing.png) |
| **User Dashboard** (Release grid and media player) | ![Dashboard](screenshots/dashboard.png) |
| **Registration Form** (Multi-step flow with OTP codes) | ![Registration](screenshots/register.png) |
| **Telegram Check** (Verification interface via Bot API) | ![Telegram Verification](screenshots/telegram_check.png) |

---

## 🚀 Key Features

*   **🔒 Secure Authentication**: Registration using email & password with 6-digit verification codes generated and sent via `nodemailer`.
*   **🤖 Telegram Subscription Verification**: Integrated with the Telegram Bot API. Access to media streaming is locked until the user joins the restaurant's/platform's Telegram channel.
*   **💻 Session & Fingerprint Protection**:
    *   JWT-based session authentication.
    *   Browser fingerprinting and VPN/proxy detection via the IPInfo API to prevent account sharing and multi-accounting.
*   **📂 Interactive File Explorer**: A file browser layout for episodes and seasons supporting responsive HLS video playback inside a custom modal player.
*   **💳 Billing Gateway (Template)**: Core logic for transaction tracking and user billing status (easily integrated with Stripe, PayPal, etc.).
*   **🎨 Premium Glassmorphism UI**: High-fidelity interface utilizing CSS `backdrop-filter: blur()`, an Apple-inspired layout, the Outfit font family, custom SVG elf mascosts, and a royal blue accent theme.

---

## 🛠️ Technology Stack

### Backend
*   Node.js (Express.js)
*   PostgreSQL (users, sessions, and files database)
*   JWT (JSON Web Tokens) for sessions
*   Nodemailer (OTP email delivery)
*   Telegram Bot API (membership checks)
*   IPInfo API (geolocation & VPN detection)

### Frontend
*   HTML5 + CSS3 (Glassmorphism layout)
*   Vanilla JavaScript (modular structure, framework-free)
*   Outfit font family
*   Fully responsive design (mobile, tablet, desktop)

---

## ⚙️ Setup and Configuration

### 1. Database Setup (PostgreSQL)

Create a database and initialize the tables using the provided schema:

```bash
psql -U postgres
CREATE DATABASE anime_platform;
\c anime_platform
\i database/schema.sql
```

### 2. Backend Setup

Navigate to the `backend` folder, install npm dependencies, and set up your environment configuration:

```bash
cd backend
npm install
cp .env.example .env
```

Edit the `.env` file to add your credentials:
*   Database connection string (`DATABASE_URL`)
*   JWT secret key (`JWT_SECRET`)
*   Telegram bot token and channel ID (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`)
*   SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
*   IPInfo API token (`IPINFO_TOKEN`)

Start the API server:
```bash
npm start
```

### 3. Frontend Setup

Serve the `frontend` folder using any static web server:

```bash
cd frontend
python -m http.server 8080
```
Or use the *Live Server* extension in VS Code. The client application will be accessible at `http://localhost:8080`.

> [!IMPORTANT]
> Make sure the `API_BASE` constant in the frontend JavaScript files (`frontend/js/`) points to your running backend server (e.g., `http://localhost:5000`).

---

## 🤖 API & Services Configuration

### Telegram Membership Bot
1.  Create a bot via [@BotFather](https://t.me/BotFather) and save the API token.
2.  Create a Telegram Channel.
3.  Add your bot as an Administrator in that channel (must have permissions to invite/view members).
4.  Get your channel's ID (e.g. using `@getidsbot`) and set `TELEGRAM_CHANNEL_ID` in `.env` (starts with `-100` for channels).

### SMTP Email Setup
If using Gmail:
1.  Enable 2-Step Verification on your Google Account.
2.  Go to App Passwords and generate a password for your backend app.
3.  Use your email as `SMTP_USER` and the 16-character generated code as `SMTP_PASS` in your `.env`.

---

## 📁 Directory Structure

```text
anime-platform/
├── backend/                  # Express.js REST API
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── middleware/       # JWT Auth verification
│   │   ├── routes/           # Router groups (auth, billing, files)
│   │   └── services/         # Integrations (emails, Telegram, VPN checks)
│   └── package.json
├── database/                 # Database scripts
│   └── schema.sql            # PostgreSQL schema script
├── frontend/                 # Static frontend code
│   ├── css/                  # Interface styles (Glassmorphism, modal player)
│   ├── js/                   # Clientside logic
│   ├── images/               # Elf mascot SVGs
│   └── *.html                # Platform pages
└── README.md
```

---

## 📄 License
This project is proprietary. All rights reserved.
