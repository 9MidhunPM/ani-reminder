# AniReminder

Plan your anime week and receive ntfy pushes for provider-confirmed episodes at 6 AM IST and exact episode airtime.

## Features

- **AniList search:** Add anime directly from AniList data without manual schedule entry.
- **Release timeline:** See published upcoming episodes in a seven-day agenda and compact lineup.
- **Verified alerts:** Confirm each exact episode with AniList before publishing; never invent weekly recurrence dates.
- **Honest lifecycle:** Keep waiting, paused, cancelled, and completed shows distinct.
- **Per-anime controls:** Pause or delete reminders independently.
- **Notification settings:** Control morning and airtime alerts independently, replace your encrypted topic, and explicitly test delivery.
- **Activity:** Review accepted, failed, uncertain, and skipped notification records.
- **Accessible interface:** Responsive desktop/mobile navigation, keyboard-safe dialogs, and reduced-motion support.

## Getting Started

Requires **Node.js 22+**, **npm 10+**, Git, and Docker with Compose v2. CI and the application image use Node.js 22. Commands below use a POSIX shell.

```sh
git clone https://github.com/9MidhunPM/ani-reminder.git
cd ani-reminder
npm ci
test -e .env || cp .env.example .env
```

Edit `.env` before starting: replace `AUTH_SECRET`, `CRON_SECRET`, and `DATA_ENCRYPTION_KEY` with three independently generated values. Run `openssl rand -base64 32` separately for each. Keep `AUTH_URL=http://localhost:3000` and the example `DATABASE_URL` for this local setup. Preserve an existing encryption key when reusing a database.

```sh
docker compose up -d --wait postgres
npx prisma generate
npm run db:deploy
npm run dev
```

Compose starts **PostgreSQL only**; the application runs in the foreground through `npm run dev`. The checked-in Compose file publishes database port 5432 on the host with development credentials. Use it only on an isolated development machine, not as a production deployment.

Open [http://localhost:3000](http://localhost:3000), create an account, and use a separate development ntfy topic. Use the same hostname and port as `AUTH_URL` for authentication and settings changes. `/api/health` returns `{"status":"ok"}` when the database is reachable.

**Local startup does not schedule notifications.** Migrations initially disable episode delivery, and `npm run dev` does not start cron. Follow the [development guide](docs/development.md) for configuration and troubleshooting, and [scheduler operations](docs/scheduler.md) before intentionally enabling real alerts. Explicit test notifications can still publish to ntfy while episode delivery is disabled.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection URL used by Prisma | Yes |
| `AUTH_SECRET` | Random secret used to encrypt authentication tokens | Yes |
| `AUTH_URL` | Canonical application URL | Yes |
| `CRON_SECRET` | Separate secret protecting the reminder scheduler endpoint | Yes |
| `DATA_ENCRYPTION_KEY` | Base64-encoded 32-byte key used to encrypt ntfy topics at rest | Yes |

Generate each secret independently with `openssl rand -base64 32`. Never reuse authentication, cron, or data-encryption keys.
Keep `DATA_ENCRYPTION_KEY` stable and backed up; changing or losing it makes existing encrypted ntfy topics unreadable.

## Commands

```bash
npm run dev          # start the development server
npm run lint         # run ESLint
npm run typecheck    # verify TypeScript types
npm run build        # create a production build
npm run db:migrate   # create and apply a development migration
npm run db:deploy    # apply committed migrations
npm test            # run deterministic scheduler and API tests
npm run test:integration # PostgreSQL tests; requires TEST_DATABASE_URL
npm run test:e2e    # browser tests against E2E_BASE_URL (default :3016)
npm run scheduler -- status # inspect delivery and reconciliation state
```

## Deployment

The multi-stage `Dockerfile` builds the Next.js standalone server, applies Prisma migrations on startup, and runs an internal minute-level cron that calls the authenticated `/api/cron` endpoint. The web server drops root privileges before listening on port `3000`. `/api/health` verifies database readiness. PostgreSQL must remain on the private container network with no external port or public domain.

The verified-schedule migration initially disables delivery and quarantines existing dates. Reconcile and verify before enabling notifications. Read [scheduler behavior](docs/scheduler.md) and the [production release runbook](docs/deployment.md) before upgrading an existing installation.

Follow the [testing guide](docs/testing.md) for a complete local QA setup. Use an isolated local database named `ani_reminder_qa`, apply migrations, explicitly disable scheduler delivery, run `npx tsx scripts/qa-seed.ts`, and start the app on `127.0.0.1:3016`. The seed checks the local hostname and database name, but does not disable delivery itself. Its illustrative schedules are test fixtures and must never be published as live release data.

## Documentation

- [Local development](docs/development.md): configuration, database setup, and troubleshooting.
- [Testing and contributor checks](docs/testing.md): isolated PostgreSQL fixtures, unit/integration checks, and Playwright setup.
- [Scheduler behavior and operations](docs/scheduler.md): verified episodes, delivery controls, and notification states.
- [Production release runbook](docs/deployment.md): controlled upgrades, verification, and recovery.

## Tech Stack

- [Next.js 16](https://nextjs.org/) and React 19
- [Tailwind CSS v4](https://tailwindcss.com/) and Framer Motion
- [Auth.js](https://authjs.dev/) credentials authentication
- [Prisma](https://www.prisma.io/) with PostgreSQL
- [AniList GraphQL API](https://docs.anilist.co/) anime metadata and exact airing schedules
- [ntfy](https://ntfy.sh/) push notifications

## License

All rights reserved.
