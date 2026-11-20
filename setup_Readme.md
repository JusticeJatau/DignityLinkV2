# DignityLink — Beginner Setup and Code Guide

This guide takes you from a fresh clone to a locally running DignityLink prototype. It explains the folders, sign-in/sign-out, beneficiary registration, API requests, and what is—and is not—needed to connect a real messaging provider.

> **Important scope note:** This project has volunteer/coordinator sign-in and beneficiary registration. It does **not** currently have a public sign-up endpoint for creating new volunteer/coordinator accounts. The included accounts are created by the demo seed script. SMS and WhatsApp delivery are **simulated** by mock providers; changing an environment variable alone does not turn on real delivery.

## 1. What the app does

DignityLink is a React website plus a Node/Express API. MongoDB stores accounts, beneficiaries, consent records, message templates, delivery logs, and feedback. Volunteers and coordinators sign in to a dashboard, register beneficiaries after recording consent, and monitor simulated scheduled messages and replies.

## 2. What you need

Install these before starting:

- Git
- Node.js (use a current LTS release) and npm
- A MongoDB database: a local MongoDB server or a MongoDB Atlas cluster

You do not need an SMS or WhatsApp provider account to run the prototype.

## 3. Download and install

```bash
git clone https://github.com/JusticeJatau/DignityLinkV2.git
cd DignityLinkV2
npm install
```

The repository includes `bun.lock`, but the documented scripts below use npm and `package.json`.

## 4. Configure MongoDB and secrets

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Open `.env` and set at least these values:

```env
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/dignitylink?retryWrites=true&w=majority"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
PORT=3000
MESSAGING_PROVIDER_MODE="mock"
SCHEDULER_CRON="0 8 * * *"
```

Replace the MongoDB URI with your own connection string. For MongoDB Atlas, create a database user, allow your development machine's IP in Network Access, and URL-encode special characters in the database password when necessary. Do not commit `.env` or paste real credentials into source code. `.env.example` is safe to share; `.env` is not.

`MONGODB_URI` is necessary for login and database features. The app can start with the database disconnected, but sign-in returns an error until MongoDB connects. `JWT_SECRET` must be a private, strong value outside local development. The example file also includes optional mock sender settings, `VITE_API_URL`, and AI Studio variables; they are not required for the basic run described here.

## 5. Start the app

The easiest local setup runs the API and Vite frontend together:

```bash
npm run dev
```

Open <http://localhost:3000>. On startup, the server attempts to connect to MongoDB. If connected, it populates an empty database with demo accounts, sample beneficiaries, and the message library.

Check the API/database status at <http://localhost:3000/api/health>. Look for a connected database status before attempting to log in.

### Optional: run frontend and API in separate terminals

Terminal 1 (API on port 5000):

```bash
STANDALONE_API_ONLY=true PORT=5000 npm run dev:server
```

Terminal 2 (Vite frontend on port 5173):

```bash
npm run dev:client
```

Vite proxies `/api` requests to `http://localhost:5000` as configured in `vite.config.ts`.

### Build and production-style start

```bash
npm run build
npm start
```

The production server serves the built `dist/` frontend when it exists. Configure environment variables in the deployment environment; never put server secrets in frontend variables.

## 6. Demo sign-in

After MongoDB is connected and the seed has run, use either demo account on the Sign In screen:

| Role | Email | Password | Access scope |
| --- | --- | --- | --- |
| Volunteer | `amina.volunteer@dignitylink.org` | `DignityVol2026!` | Bakassi IDP Camp |
| Coordinator | `grace.coordinator@dignitylink.org` | `DignityCoord2026!` | All Communities |

These credentials are for local demonstration only. Do not deploy them or use them for real beneficiary data. Change/remove demo users and implement a secure account-management process before any real deployment.

To manually seed a connected database:

```bash
npm run seed
```

**Destructive warning:** `npx tsx server/seed/seedRunner.ts --force` clears the app's users, message templates, beneficiaries, message logs, feedback, and scheduler runs before reseeding. Use only on a disposable development database.

## 7. Repository map: where to look

```text
.
├── client/
│   └── src/
│       ├── main.tsx                 React browser entry point
│       ├── App.tsx                  Public page/workspace selection and navigation
│       ├── components/              Sign-in, dashboard, beneficiary, messages, logs, phone UI
│       ├── context/AuthContext.tsx  Shared signed-in user and login/logout actions
│       ├── lib/api.ts               Fetch helper; adds API base URL and JWT header
│       ├── types/                    Frontend TypeScript data types
│       └── assets/                   Images and other frontend assets
├── server.ts                        Starts the backend entry point
├── server/
│   ├── index.ts                     Connects DB, seeds, starts scheduler and HTTP server
│   ├── app.ts                       Express middleware, health check, and API route mounting
│   ├── config/                      Environment parsing and MongoDB connection
│   ├── middleware/auth.ts           JWT validation and role checks
│   ├── models/                      Mongoose schemas (User, Beneficiary, logs, feedback, etc.)
│   ├── routes/                      HTTP endpoints for auth, beneficiaries, dashboard, messages, phone
│   ├── services/                    Messaging workflow and daily scheduler
│   ├── providers/                   Shared messaging interface and mock SMS/WhatsApp adapters
│   └── seed/                        Demo accounts, sample data, and bilingual lesson templates
├── .env.example                     Environment variable template
├── package.json                     Dependencies and npm commands
└── vite.config.ts                   Vite configuration and /api development proxy
```

### How a request moves through the app

`client/src/main.tsx` renders `App.tsx`. `AuthProvider` in `client/src/context/AuthContext.tsx` checks the API health and, if a saved JWT exists, validates it through `/api/auth/me`. UI components call `apiRequest` from `client/src/lib/api.ts`; Express routes in `server/routes/` validate the request, use Mongoose models in `server/models/`, and return JSON. When an outbound message is needed, `messagingService.ts` asks `providerFactory.ts` for an adapter and stores a message log.

## 8. How sign-in and sign-out work

1. `ProgramOverviewPage.tsx` opens `SignInModal.tsx`.
2. The modal calls `login(email, password)` from `AuthContext.tsx`.
3. The browser sends `POST /api/auth/login` to `server/routes/authRoutes.ts`.
4. The server checks MongoDB for an active account and compares the password with its bcrypt hash, then returns a signed JWT and user details.
5. The frontend stores that JWT in browser `localStorage` under `dignitylink_jwt`. `apiRequest` adds it to protected requests as `Authorization: Bearer <token>`.
6. `server/middleware/auth.ts` checks the token on protected routes. The UI displays the workspace when a user is signed in.
7. Sign out calls `logout()` in `AuthContext.tsx`, which removes the browser token and clears the user state.

There is no server-side logout/revocation endpoint in the current prototype. Sign-out removes the token from this browser; the JWT remains valid until it expires (default: seven days) if it was copied elsewhere. The token is stored in `localStorage`, so this is a prototype implementation, not a complete production security design.

## 9. Registering a beneficiary (not a staff login)

In the signed-in workspace, open **Beneficiaries** and choose **Register Beneficiary**. Enter the beneficiary's name, phone, language, channel, and community, record the plain-language explanation and explicit consent, and provide guardian details/consent if the beneficiary is under 18. Submit the form.

The UI is in `client/src/components/BeneficiariesView.tsx`; the API is `POST /api/beneficiaries` in `server/routes/beneficiaryRoutes.ts`; the MongoDB schema is `server/models/Beneficiary.ts`. The backend—not only the form—checks the required consent, phone number, duplicate number, community scope, and guardian-consent rules. A successful registration creates a beneficiary record and dispatches a **simulated** welcome message through the mock provider.

For an API example, first sign in and copy the returned token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"amina.volunteer@dignitylink.org","password":"DignityVol2026!"}'
```

Use the `token` value in the next request (replace `YOUR_TOKEN`):

```bash
curl -X POST http://localhost:3000/api/beneficiaries \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "fullName":"Example Beneficiary",
    "phoneNumber":"+2348031234567",
    "preferredChannel":"sms",
    "preferredLanguage":"en",
    "community":"Bakassi IDP Camp",
    "startDate":"2026-11-20",
    "age":24,
    "consent":{"given":true,"explanationConfirmed":true,"givenBy":"Example Beneficiary"},
    "guardianConsent":{"given":false},
    "kitDistributed":{"padsCount":3,"soapIncluded":true,"pouchIncluded":true}
  }'
```

Use test data in development. For a volunteer, the backend uses their assigned community; coordinators can select a community. Never record consent unless it was actually obtained.

### Creating a volunteer/coordinator login

There is currently **no** `/api/auth/register` endpoint or self-service staff account form. `User` records are created by `server/seed/seedData.ts` for the demo. For an actual organization, add an administrator-only account creation/invitation flow with input validation, secure password hashing, role restrictions, and audit logging; do not expose a public endpoint that lets anyone choose the coordinator role. Do not manually store plain-text passwords.

## 10. Connecting an API and understanding `VITE_API_URL`

The frontend already uses a real HTTP API: `client/src/lib/api.ts` uses `fetch()` for `/api/...` endpoints. For local development, the unified server handles these requests, or Vite proxies them to port 5000 in split mode.

If the frontend and backend are deployed on different origins, set `VITE_API_URL` to the backend origin when building/running the frontend, for example:

```env
VITE_API_URL="https://api.example.org"
```

This changes the prefix used by frontend `fetch` calls; it does not create an API or connect the backend to MongoDB. The backend still needs `MONGODB_URI`, and a separate-origin deployment must configure appropriate CORS rules in `server/app.ts`. Values prefixed with `VITE_` are included in browser code and are **public**—never put passwords, JWT secrets, database URLs, or provider tokens there.

Useful current endpoints include:

| Method | Path | Purpose | Login required? |
| --- | --- | --- | --- |
| `GET` | `/api/health` | API, database, scheduler, and provider status | No |
| `POST` | `/api/auth/login` | Sign in and receive a JWT | No |
| `GET` | `/api/auth/me` | Validate token and get current user | Yes |
| `GET` | `/api/beneficiaries` | List/filter beneficiaries | Yes |
| `POST` | `/api/beneficiaries` | Register a beneficiary | Yes |
| `PATCH` | `/api/beneficiaries/:id/opt-out` | Opt out/reactivate | Yes |
| `GET` | `/api/beneficiaries/:id/timeline` | Beneficiary history | Yes |
| `GET` | `/api/phone/beneficiaries` | Simulator contacts | Yes |
| `POST` | `/api/phone/reply` | Simulate a beneficiary reply | Yes |

See `server/app.ts` for the complete route mounts and each file in `server/routes/` for request/response details.

## 11. Connecting real SMS or WhatsApp delivery

The current behavior is deliberately mocked. `server/providers/MockSmsProvider.ts` and `MockWhatsAppProvider.ts` return simulated delivery results. More importantly, `server/providers/providerFactory.ts` currently returns those mock adapters even when `MESSAGING_PROVIDER_MODE` is set to something other than `mock`. Therefore **do not expect live messages by changing the mode or adding API keys**.

A real integration requires backend development and provider setup:

1. Choose a provider and obtain the appropriate approved account, sender/phone number, credentials, and webhook configuration.
2. Implement an adapter matching `IMessagingProvider` in `server/providers/MessagingProvider.ts` (`sendMessage`, `parseInboundReply`, and `getCapabilities`). Follow the chosen provider's official API and webhook verification requirements.
3. Update `server/providers/providerFactory.ts` to select the adapter only when explicitly configured and valid credentials are present. Fail safely rather than silently pretending a live message was sent.
4. Add provider credentials to server-side environment configuration (`server/config/env.ts` and `.env.example` with placeholder names only). Keep secrets on the server, not in React/Vite code or Git.
5. Implement and secure incoming-message webhooks, verify provider signatures, map a sender to the right beneficiary, and process opt-outs promptly. The current `/api/phone/reply` endpoint is an authenticated **simulator**, not a public provider webhook.
6. Test with provider sandbox/test numbers, delivery failures, duplicate webhooks, opt-outs, rate limits, retries, and logging before a controlled rollout.

The prototype has an interface intended to make adapter replacement easier, but live delivery, live inbound webhooks, and production credentials are not configured here. Health education content and translations also need qualified review before real-world use.

## 12. Useful commands

```bash
npm run dev          # Full-stack development server
npm run dev:server   # Backend entry point (use STANDALONE_API_ONLY=true for API-only mode)
npm run dev:client   # Vite frontend only, port 5173
npm run build        # Build frontend into dist/
npm start            # Start server in production mode
npm run seed          # Seed demo data (requires MongoDB)
npm run lint          # TypeScript type-check (tsc --noEmit)
```

## 13. Common problems

- **Sign-in says MongoDB is not connected:** Check `.env` exists, `MONGODB_URI` is correct, the Atlas IP allow-list and database user are configured, and restart the server. Check `/api/health` and the server terminal.
- **Demo login is rejected:** Ensure seed completed against the same MongoDB database named in `MONGODB_URI`; run `npm run seed` and check its output.
- **Frontend loads but API requests fail in split mode:** Keep the API on port 5000 and run Vite on port 5173, as shown above. Check the browser network panel and backend terminal.
- **Messages do not arrive on a real phone:** That is expected; providers are mocks and log simulated activity. No live SMS/WhatsApp gateway is implemented/configured.
- **Type check fails:** Run `npm run lint` and address the TypeScript errors shown by the command.

## 14. Before real deployment

This is a hackathon prototype, not a production-ready health or messaging service. At minimum, remove demo credentials and unsafe seed access, use a strong private JWT secret, review token storage/session protections, add staff account management and password reset, restrict CORS, validate/rate-limit endpoints, protect personal and consent data, configure backups and monitoring, implement verified messaging webhooks, and obtain clinical, local-language, privacy, and safeguarding review. Follow applicable laws and organizational policies for health-related data and minors.
