# AniReminder

Track seasonal anime releases and receive ntfy pushes at 6 AM IST and exact episode airtime.

## Features

- **Jikan search:** Add anime directly from MyAnimeList data without manual schedule entry.
- **Release alerts:** Deliver release-day and airtime notifications through a private ntfy topic.
- **Schedule tracking:** Follow weekly and irregular episode dates with live countdowns.
- **Per-anime controls:** Pause or delete reminders independently.
- **Editorial interface:** Use a responsive, image-led dark layout designed for anime watchlists.

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
| `NEXTAUTH_SECRET` | Random secret used to sign authentication tokens | Yes |
| `NEXTAUTH_URL` | Canonical application URL | Yes |
| `CRON_SECRET` | Separate secret protecting the reminder scheduler endpoint | Yes |

Generate secrets with `openssl rand -base64 32`. Never reuse `NEXTAUTH_SECRET` as `CRON_SECRET`.

## Commands

```bash
npm run dev          # start the development server
npm run lint         # run ESLint
npm run typecheck    # verify TypeScript types
npm run build        # create a production build
npm run db:migrate   # create and apply a development migration
npm run db:deploy    # apply committed migrations
```

## Deployment

The multi-stage `Dockerfile` builds the Next.js standalone server, applies Prisma migrations on startup, and runs an internal minute-level cron that calls the authenticated `/api/cron` endpoint. The container listens on port `3000`.

## Tech Stack

- [Next.js 15](https://nextjs.org/) and React 19
- [Tailwind CSS v4](https://tailwindcss.com/) and Framer Motion
- [Auth.js](https://authjs.dev/) credentials authentication
- [Prisma](https://www.prisma.io/) with PostgreSQL
- [Jikan API](https://docs.api.jikan.moe/) anime metadata
- [ntfy](https://ntfy.sh/) push notifications

## License

Private project. All rights reserved.
