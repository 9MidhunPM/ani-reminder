# Published episodes only

AniReminder follows AniList airing records. It never calculates a weekly recurrence or increments an episode number to create a schedule.

Each saved show has a provider lifecycle and a separate user pause preference. A missing schedule is Waiting; a finished season is Completed. A failed refresh keeps delivery suppressed until the source can be checked again. Existing schedules enter Unverified during migration because previous versions may have generated their dates.

The scheduler stores pending morning and airtime records for confirmed episodes. Before publishing, it verifies that the exact episode, anime identity, and current airtime are still supported by AniList. A confirmed finale can be delivered shortly after airing even when the title has switched to Finished. AniList does not guarantee retained historical schedules; missing confirmation suppresses an alert.

Morning alerts are eligible from 06:00 until 07:00 IST on the airing day, and only before the episode airs. Airtime alerts are eligible for 30 minutes after the confirmed airing time. Neither alert may precede the deployment cutoff. Late alerts expire rather than announce an old episode as current.

Delivery identity is user + anime + episode + notification kind. Postponement changes unsent timing without creating a second successful alert. Pausing or removing a show cancels pending work; re-adding preserves successful and uncertain delivery records. Account deletion removes associated history.

Concurrent cron requests use a shared database lease and atomic delivery claims. An abandoned claim or ambiguous publish is Uncertain and is not automatically retried. A successful ntfy receipt means the server accepted the message; it does not establish that a phone displayed it.

Tests use frozen clocks and mocked providers/publishers. PostgreSQL integration checks exercise migration, uniqueness, retained records, and deletion behavior. Browser tests exercise the display of lifecycle states and explicit notification controls.

Provider references: [AniList schedules](https://docs.anilist.co/reference/object/airingschedule), [rate limits](https://docs.anilist.co/guide/rate-limiting), and [ntfy publishing](https://docs.ntfy.sh/publish/).
