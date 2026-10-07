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

Requires Node.js 22+, npm 10+, Docker, and Docker Compose.

```bash
git clone https://github.com/9MidhunPM/ani-reminder.git
cd ani-reminder
npm install
cp .env.example .env
docker compose up -d
npm run db:deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and enter an ntfy topic subscribed in the [ntfy app](https://ntfy.sh/docs/subscribe/phone/).

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

For local browser QA, use an isolated local database named `ani_reminder_qa`, apply migrations, run `npx tsx scripts/qa-seed.ts`, and start the app on `127.0.0.1:3016`. The seed refuses production databases. Its illustrative schedules are test fixtures and must never be published as live release data.

## Tech Stack

- [Next.js 16](https://nextjs.org/) and React 19
- [Tailwind CSS v4](https://tailwindcss.com/) and Framer Motion
- [Auth.js](https://authjs.dev/) credentials authentication
- [Prisma](https://www.prisma.io/) with PostgreSQL
- [AniList GraphQL API](https://docs.anilist.co/) anime metadata and exact airing schedules
- [ntfy](https://ntfy.sh/) push notifications

## License

All rights reserved.
