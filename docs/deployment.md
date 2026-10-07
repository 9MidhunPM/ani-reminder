# Controlled production release

The existing Dokploy application builds the repository's `main` branch with `Dockerfile`, serves HTTPS at `ani-reminder.midhunpm.in`, and listens on container port 3000. PostgreSQL remains on the private Docker network.

## Before merging

Run lint, TypeScript, unit tests, PostgreSQL integration tests, the production build, and desktop/mobile browser tests. Verify both a clean migration and an upgrade with existing account/reminder data. Build and startup checks are separate from live provider and notification checks.

Create a private PostgreSQL custom-format dump, verify it is nonempty and readable by `pg_restore --list`, and retain the current application image for rollback. Preserve the existing data-encryption key and all deployment secrets.

Stop the old application service before merging. Its internal cron predates the new database lease and can continue publishing fabricated schedules if it overlaps the new scheduler. The cutover intentionally allows a short application outage.

## Migrate and verify

Merge the feature branch preserving its individual commits. The container entrypoint applies committed migrations before starting the server. Migration creates a singleton scheduler control with delivery disabled and a shared cutoff timestamp.

Check `/api/health` for database-backed readiness. Inspect the new deployment revision and application logs. Use the scheduler CLI from inside the application container:

```sh
npm run scheduler -- status
npm run scheduler -- reconcile
npm run scheduler -- status
```

Reconcile existing records while delivery remains disabled. Confirm ended seasons are Completed, unsupported schedules are Waiting/Unverified, and no scheduled episode exceeds a known total. Preserve user pause preferences. Repeat bounded reconciliation if provider limits defer some entries.

Exercise authentication, search, following a show, navigation, settings, and history using an isolated verification account. Notification tests must use an isolated topic, and be explicitly identified as tests. Delete the verification account afterward.

Enable delivery only after reconciliation and application checks succeed:

```sh
npm run scheduler -- enable
```

Observe subsequent cron summaries for reconciliation, suppression, and delivery failures. Confirm the remote Git ref and deployed revision correspond to the verified release.

## Recovery

Keep delivery disabled when source confirmation, database readiness, or scheduler checks fail:

```sh
npm run scheduler -- disable
```

Do not start the old scheduler against migrated nullable schedules. Prefer a forward fix; any image rollback must keep old cron stopped and account for the new schema. Restore a database backup only as an intentional recovery step, since it replaces later account changes.
