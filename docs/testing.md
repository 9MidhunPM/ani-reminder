# Testing and contributor checks

[Back to the README](../README.md) · [Local development](development.md)

Run commands from the repository root. Use Node.js 22 to match [the verification workflow](../.github/workflows/verify.yml). The full gate includes static checks, unit tests, PostgreSQL integration tests, a production build, and Chromium browser tests at desktop and mobile viewport sizes.

## Static checks and unit tests

```sh
npm ci
npx prisma generate
npm run lint
npm run typecheck
npm test
git diff --check
```

`npm test` runs `tests/*.test.ts`, covering scheduling policy, delivery decisions, API handlers, validation, and agenda behavior. These tests use controlled clocks and injected or mocked dependencies; they do not validate live AniList results or phone delivery. Prisma client generation is needed for checks that import generated types/runtime definitions.

## Prepare a disposable PostgreSQL database

Integration tests **write and delete data**, create/drop a temporary migration schema, and temporarily change scheduler control records. They require a local `TEST_DATABASE_URL` whose database path contains `qa` or `test`. Browser fixtures and the seed use the stricter local `ani_reminder_qa` name check. These guards are not a substitute for using an empty disposable database.

Use a separate database from your normal development installation. The example below runs a temporary PostgreSQL 16 container bound only to loopback on port 55432. The password is a local fixture, not a deployment credential. Choose another container name or port if already occupied; do not remove an existing database to make room.

```sh
docker run --detach --rm --name ani-reminder-test-db \
  -e POSTGRES_DB=ani_reminder_qa \
  -e POSTGRES_USER=ani_qa \
  -e POSTGRES_PASSWORD=local-test-password \
  -p 127.0.0.1:55432:5432 \
  postgres:16-alpine

docker exec ani-reminder-test-db pg_isready -U ani_qa -d ani_reminder_qa
```

Wait until `pg_isready` reports that it is accepting connections before continuing. Keep this environment in one terminal for the remaining commands:

```sh
export DATABASE_URL='postgresql://ani_qa:local-test-password@127.0.0.1:55432/ani_reminder_qa'
export TEST_DATABASE_URL="$DATABASE_URL"
export AUTH_URL='http://127.0.0.1:3016'
export AUTH_SECRET="$(openssl rand -base64 32)"
export CRON_SECRET="$(openssl rand -base64 32)"
export DATA_ENCRYPTION_KEY="$(openssl rand -base64 32)"

npm run db:deploy
npm run scheduler -- disable
npm run test:integration
```

Use freshly generated keys only for this fresh test database. Exported values take precedence over `.env`; do not use production values. Do not run an application scheduler or another test process against this database while integration tests are executing. The package script sets `--test-concurrency=1` because the tests share scheduler control state.

Integration coverage includes:

- Applying the historical migrations to synthetic legacy data, preserving accounts and pause preferences, and quarantining schedules as `UNVERIFIED`.
- Delivery uniqueness, notification retention after removing/re-adding a reminder, and account deletion cascades.
- Database leases, atomic claims, revoked reminder checks, and abandoned claims becoming `UNCERTAIN`.
- Timestamp comparisons under a non-UTC PostgreSQL session (`Asia/Kolkata`).

## Seed and run browser tests

Use the same isolated environment after integration tests finish:

```sh
npm run scheduler -- disable
npx tsx scripts/qa-seed.ts
npm run build
npx playwright install --with-deps chromium
E2E_START_SERVER=true npm run test:e2e
```

Playwright's browser installation may need system-package privileges. `npm run build` creates the production build that the test server starts; the test command does not build automatically.

The seed creates `qa@anireminder.example` with the public test password `AniReminder-QA-2026` and illustrative reminder states. These are fixtures for an isolated local database, never production credentials or verified release schedules. Re-running the seed updates its reminder fixtures, but does not reset an existing QA account's password or topic. It also does **not** turn off scheduler delivery despite its completion message, so explicitly disable delivery first.

Do not call the real notification-test endpoint with the seed's shared topic, and do not enable the scheduler for fixtures. Browser tests mock selected API responses, but the app can still load remote artwork; this is not a fully offline suite or a live-provider verification.

[playwright.config.ts](../playwright.config.ts) defines these controls:

| Setting | Behavior |
| --- | --- |
| `E2E_START_SERVER=true` | Starts `npm run start -- --hostname 127.0.0.1 --port 3016`. Any nonempty value enables this, including `false`; unset it to disable automatic startup. |
| `E2E_BASE_URL` | Browser destination, defaulting to `http://127.0.0.1:3016`. It does not change the automatic server's fixed port. |
| `CI` | Enables one retry and disables reuse of an existing server. |
| Projects | Desktop Chrome at 1440×1000 and Pixel 7 device emulation, both using Chromium. |
| Output | Failure traces/screenshots under `/tmp/ani-reminder-browser-results`; tests also capture `/tmp/ani-*.png`. |

Outside CI, Playwright may reuse a server already listening on port 3016. Stop an unrelated or stale server first so the test does not accidentally exercise the wrong build or database. To use an existing QA server intentionally, start it with the same database and origin settings, leave `E2E_START_SERVER` unset, and then run `npm run test:e2e`.

Changing only `E2E_BASE_URL` does not configure the application origin. Align `AUTH_URL` with the server origin, and keep browser fixtures local. Never point these tests at a production service.

## Finish and report results

Stop only the disposable container created above when you no longer need its data:

```sh
docker stop ani-reminder-test-db
```

Because it was created with `--rm` and without a persistent named volume, its database is discarded. Close the test terminal or unset its exported variables before returning to ordinary development.

When reporting a change, name the exact checks that passed, failed, or were not run. A unit-test pass does not imply integration/browser success. CI runs the full sequence in `.github/workflows/verify.yml`; compare its result with the commit being reviewed. Live provider verification, intentional notification delivery, production upgrades, and rollback readiness remain separate checks in the [release runbook](deployment.md).
