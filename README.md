# DignityLink — Menstrual Hygiene Education by SMS and WhatsApp

DignityLink is a full-stack MERN prototype built for the **InnovateHER Hackathon (Girls Who Code — Women's Health & Wellness Track)** by Justice Jatau. It supports community volunteers distributing reusable menstrual hygiene kits in IDP camps and rural communities by capturing informed consent, delivering a 12-week bilingual (English and Hausa) SMS/WhatsApp curriculum via a swappable mock provider layer, and capturing two-way feedback (`1` = helpful, `2` = question, `STOP` = opt-out).

## Project Structure

- `client/` — React + Tailwind CSS frontend (Program Overview, Sign In modal, Volunteer & Coordinator Dashboard, Beneficiary Registration & Consent Gate, 12-Week Message Library, Simulated Phone Drawer & Tab, Feedback & Mock Provider Audit Logs, Architecture & Roadmap)
- `server/` — Node.js + Express.js + Mongoose + JWT + `node-cron` backend, shared `IMessagingProvider` interface, `MockSmsProvider`, `MockWhatsAppProvider`, and seed scripts
- `server.ts` — Unified entry point serving both the API and frontend on port `3000`

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment Variables

Copy `.env.example` to `.env` and set your MongoDB connection string and JWT secret:

```bash
cp .env.example .env
```

Required variables in `.env`:

```env
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/dignitylink?retryWrites=true&w=majority"
JWT_SECRET="replace-with-a-strong-random-secret"
PORT=3000
MESSAGING_PROVIDER_MODE="mock"
SCHEDULER_CRON="0 8 * * *"
```

## 3. Populate the Database (Seed Data)

The server automatically seeds initial demo data on startup if the database is empty. You can also run or reset the seed explicitly:

```bash
npm run seed
# Or force-reset and reseed all collections:
npx tsx server/seed/seedRunner.ts --force
```

Demo accounts created by the seed script:
- **Volunteer** (scoped to `Bakassi IDP Camp`): `amina.volunteer@dignitylink.org` / `DignityVol2026!`
- **Coordinator** (access to all communities & curriculum editing): `grace.coordinator@dignitylink.org` / `DignityCoord2026!`

## 4. Run the Application

### Unified Full-Stack Mode (Port 3000)

```bash
npm run dev
```

### Standalone Backend & Frontend Terminals

```bash
# Terminal 1: Backend API on port 5000
STANDALONE_API_ONLY=true PORT=5000 npm run dev:server

# Terminal 2: Vite Frontend on port 5173 (proxies /api to localhost:5000)
npm run dev:client
```

### Production Build & Start

```bash
npm run build
npm start
```
