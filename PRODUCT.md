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

Users discover shows through AniList search, subscribe to a private ntfy topic, and return to a dense lineup view to pause, resume, or remove reminders.

## Capabilities and Constraints

- Anime search and schedule data come from AniList GraphQL.
- Reminder delivery uses ntfy topics.
- The authenticated lineup supports add, pause, resume, and delete.
- The first add sends a test notification so a user can verify their ntfy topic.
- The product is deployed as a Next.js standalone container with PostgreSQL.

## Brand Commitments

The existing name is AniReminder. The established voice is concise, direct, release-focused, and editorial. The existing public-facing visual system uses a dark near-black background, warm off-white text, a sharp red accent, Bebas Neue display type, and DM Sans body type.

## Evidence on Hand

- Live product: https://ani-reminder.midhunpm.in
- Real anime cover artwork from AniList and MyAnimeList CDN sources.
- Verified production flows for account creation, search, adding One Piece, ntfy test delivery, and account cleanup.

## Product Principles

- Make release timing obvious.
- Let the user verify notifications immediately.
- Keep the lineup fast to scan.
- Prefer precise schedule data over vague availability labels.
- Keep notification configuration private and server-owned.
