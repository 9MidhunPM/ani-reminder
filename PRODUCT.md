# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Weekly anime watchers who follow seasonal shows and want reliable release alerts without manually checking each show.

## Product Purpose

AniReminder lets people search for anime, build a personal lineup, and receive ntfy notifications for the day-of airing reminder and the episode release alert.

## Positioning

The product turns AniList airing schedules into precise, private ntfy alerts instead of asking viewers to remember release times or repeatedly check a tracker.

## Operating Context

Users discover shows through AniList search, subscribe to a private ntfy topic, and return to a release timeline with their next published episode and a seven-day agenda. Their lineup retains shows awaiting a schedule and provides pause, resume, and removal controls.

## Capabilities and Constraints

- Anime search and schedule data come from AniList GraphQL.
- Reminder delivery uses ntfy topics.
- The authenticated lineup supports add, pause, resume, and delete.
- The week view shows enabled, published future airings in IST; it does not predict recurring release dates.
- Finished and cancelled seasons appear in Completed, while shows without a published future date remain in the lineup awaiting a schedule.
- Morning and airtime notifications can be enabled independently in Settings.
- Adding a show sends no notification. A deliberate Settings action sends a clearly labeled test to the saved topic, with a one-minute rate limit.
- Activity exposes delivery outcomes, including uncertainty. Provider acceptance does not confirm that a device displayed the message.
- Saved ntfy topics are encrypted and never returned by account settings responses.
- The product is deployed as a Next.js standalone container with PostgreSQL.

## Brand Commitments

The existing name is AniReminder. The established voice is concise, direct, release-focused, and editorial. The existing public-facing visual system uses a dark near-black background, warm off-white text, a sharp red accent, Bebas Neue display type, and DM Sans body type.

## Evidence on Hand

- Live product: https://ani-reminder.midhunpm.in
- Real anime cover artwork from AniList and MyAnimeList CDN sources.
- The current source and local desktop/mobile captures document the implemented release timeline; see `DESIGN.md` for the visual system and review boundary.
- Earlier product evidence recorded production signup, search, adding One Piece, test delivery, and cleanup. Those earlier checks do not establish deployment or notification delivery for the current revision.

## Product Principles

- Make release timing obvious.
- Let the user verify notifications immediately.
- Keep the lineup fast to scan.
- Prefer precise schedule data over vague availability labels.
- Keep notification configuration private and server-owned.
