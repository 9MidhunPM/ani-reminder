# Published episodes only

[Back to the README](../README.md) · [Local development](development.md) · [Testing](testing.md)

## Schedule and delivery rules

AniReminder follows AniList airing records. It never calculates a weekly recurrence or increments an episode number to create a schedule.

Each saved show has a provider lifecycle and a separate user pause preference. A missing schedule is Waiting; a finished season is Completed. A failed refresh keeps delivery suppressed until the source can be checked again. Existing schedules enter Unverified during migration because previous versions may have generated their dates.

The scheduler stores pending morning and airtime records for confirmed episodes. Before publishing, it verifies that the exact episode, anime identity, and current airtime are still supported by AniList. A confirmed finale can be delivered shortly after airing even when the title has switched to Finished. AniList does not guarantee retained historical schedules; missing confirmation suppresses an alert.

Morning alerts are eligible from 06:00 until 07:00 IST on the airing day, and only before the episode airs. Airtime alerts are eligible for 30 minutes after the confirmed airing time. Neither alert may precede the deployment cutoff. Late alerts expire rather than announce an old episode as current.

Delivery identity is user + anime + episode + notification kind. Postponement changes unsent timing without creating a second successful alert. Pausing or removing a show cancels pending work; re-adding preserves successful and uncertain delivery records. Account deletion removes associated history.

Concurrent cron requests use a shared database lease and atomic delivery claims. An abandoned claim or ambiguous publish is Uncertain and is not automatically retried. A successful ntfy receipt means the server accepted the message; it does not establish that a phone displayed it.

Tests use frozen clocks and mocked providers/publishers. PostgreSQL integration checks exercise migration, uniqueness, retained records, and deletion behavior. Browser tests exercise the display of lifecycle states and explicit notification controls.

Provider references: [AniList schedules](https://docs.anilist.co/reference/object/airingschedule), [rate limits](https://docs.anilist.co/guide/rate-limiting), and [ntfy publishing](https://docs.ntfy.sh/publish/).


## What starts the scheduler

The [container entrypoint](../docker-entrypoint.sh) applies migrations, starts an internal cron daemon, and calls `GET /api/cron` once per minute with `Authorization: Bearer <CRON_SECRET>`. The [route](../src/app/api/cron/route.ts) rejects a missing or incorrect token with HTTP 401. A scheduler exception returns HTTP 503; a successful run returns JSON counters and logs a summary.

Neither `npm run dev` nor `npm run start` starts cron. The checked-in Compose file starts only PostgreSQL. When running outside the application image, recurring invocation must be arranged separately by the operator. Do not add a second scheduler just to work around provider backoff or an active lease.

The scheduler uses a nominal 45-second work budget and reserves time for verification and publication, so a run may process only part of the due work. Its database lease lasts 60 seconds and is renewed during work. A run that cannot acquire the lease returns `leased: false` with zero counters. This is not proof that all pending work is complete.

## CLI reference

Run these commands from the repository root with the intended database and secrets in the environment. For local `.env` loading, use `node --env-file=.env --import tsx scripts/scheduler.ts COMMAND` in place of the npm form below. In a running application container, use its existing environment. Check the destination before any write command.

| Command | Effect |
| --- | --- |
| `npm run scheduler -- status` | Reads the global switch, cutoff, lease/backoff state, and grouped schedule/delivery counts. Does not publish or reconcile. |
| `npm run scheduler -- reconcile` | Runs bounded reconciliation with episode publishing disabled for this invocation. It contacts AniList and writes schedules/intents, recovers abandoned claims, and cleans old rate-limit records. This is **not a dry run**. |
| `npm run scheduler -- disable` | Sets the global episode-delivery switch to false. It does not erase history, clear the queue, or stop cron/reconciliation. |
| `npm run scheduler -- enable` | Enables episode delivery after rejecting active AniList-backed reminders still marked `UNVERIFIED`. This does not run a scheduler tick or verify phone delivery. |

No argument defaults to `status`. Unsupported arguments fail with a usage message. The implementation is in [scripts/scheduler.ts](../scripts/scheduler.ts).

The status result includes:

- `deliveryEnabled`: the global switch for scheduled episode notifications.
- `cutoverAt`: the earliest allowed scheduled notification time, established by the verified-schedule migration.
- `leaseActive`: whether the stored lease has not yet expired at the time of this read.
- `providerBackoffUntil`: a shared provider cooldown, or `null`.
- `schedules` and `deliveries`: grouped state counts across the database, not a single user's account.

Reconciliation and cron return `leased`, `checked`, `sent`, `skipped`, `deferred`, `failed`, and `uncertain`. These are counters for that invocation, not a durable audit log or the total queue size. `checked` counts completed reminder refreshes; a zero `sent` count can be normal when no alert is eligible or delivery is disabled. Inspect Activity and status alongside the counters.

## Delivery controls are separate

1. **Global delivery:** migration creates the control record with `deliveryEnabled=false`.
2. **Account preferences:** morning and airtime alerts can be enabled independently.
3. **Reminder pause:** an individual show's `enabled` setting gates its alerts.
4. **Source and time checks:** the exact episode must remain confirmed, inside its delivery window, and at or after the cutoff.

Enabling one control does not bypass the others. Paused reminders are not part of the scheduler's normal refresh scan. Legacy reminders without an AniList ID remain unverified and must be re-added through AniList search.

For a fresh installation intended to send real episode alerts, inspect status, reconcile while disabled, and inspect status and the application again. Respect provider backoff and repeat bounded reconciliation when necessary. Enable only after reviewing the results and confirming that the database contains real accounts and provider-backed reminders. Upgrading an existing installation also requires the additional cutover steps in the [production release runbook](deployment.md).

**Explicit test notifications are separate from episode delivery.** The authenticated Settings action can publish to `ntfy.sh` even when the global switch, morning alerts, or airtime alerts are off. It records a `TEST` delivery and is rate-limited. Use only a private test topic you control. Do not use the public QA fixture topic for a live delivery test.

Disabling delivery cannot recall a message already accepted by ntfy. Keep synthetic QA databases isolated, leave delivery disabled, and do not start recurring cron against them.

## Reading notification history

| Stored state | Activity label | Meaning |
| --- | --- | --- |
| `PENDING` | Queued | An intent exists; it still needs eligibility checks and a worker claim. |
| `CLAIMED` | Sending | A worker has claimed the attempt. This is not a delivery receipt. |
| `SENT` | Accepted by ntfy | ntfy returned a valid receipt that was saved. Check the phone separately. |
| `FAILED` | Failed | A definite failure was recorded. Eligible episode deliveries may be attempted again while their window remains open, up to three claims. |
| `UNCERTAIN` | Unconfirmed | Acceptance could not be established, or a worker stopped before recording the outcome. It may have arrived and is not automatically retried. |
| `SKIPPED` | Skipped | The alert was no longer eligible, for example because its window expired, the reminder was disabled, or the source no longer confirmed it. |

A skipped intent with fewer than three claims can become pending again when reconciliation finds an eligible schedule; successful and uncertain records remain protected from duplicate sends. Test notifications are not retried by the episode scheduler.

Abandoned claims older than two lease intervals are converted to `UNCERTAIN` when a later scheduler run performs recovery. If no scheduler is running, history can remain at Sending until recovery runs. Do not reset uncertain records to pending to force a retry.

## Troubleshooting without sending extra messages

- **No new alerts:** start with `status`. Confirm a recurring caller exists, global delivery is enabled intentionally, the user's relevant preference is enabled, and the show is not paused. A Waiting or Completed show does not imply a missing recurring weekly date.
- **Reconciliation defers work:** inspect `providerBackoffUntil`, wait for the provider cooldown, and retry later. AniList requests share a database-backed request budget; repeatedly starting workers does not remove that limit.
- **Enable fails:** verify the database is available, migrations created the control record, and active AniList reminders are no longer `UNVERIFIED`. The CLI deliberately reports a generic failure rather than exposing connection strings.
- **Unconfirmed delivery:** inspect the device and ntfy history before taking any manual action. A timeout or invalid receipt may follow an accepted publish.
- **Accepted by ntfy but absent on a phone:** check the exact topic subscription and device notification settings. The receipt does not verify the phone's connectivity or display.

See [runner](../src/lib/scheduling/runner.ts), [delivery policy](../src/lib/scheduling/policy.ts), [delivery decisions](../src/lib/scheduling/deliver.ts), and [test notifications](../src/lib/test-notification.ts) for the implemented boundaries. See the [testing guide](testing.md) for synthetic verification without live notifications.
