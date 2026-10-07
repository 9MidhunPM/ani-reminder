# AniReminder design system

This document describes the implemented interface, grounded in the current components and stylesheet. AniReminder presents a release timeline: the next published episode comes first, followed by a seven-day agenda and a persistent personal lineup.

## Visual language

The interface uses near-black olive surfaces, warm white text, coral actions, compact anime artwork, and thin editorial dividers. Bebas Neue gives page titles and dates their condensed shape; DM Sans carries controls, descriptions, and schedule details. Artwork belongs to the associated title and is never evidence of a release date.

| Token | Value | Purpose |
| --- | --- | --- |
| Background | `#111210` | Page canvas |
| Foreground | `#f4f1e9` | Main text |
| Surface | `#191a17` | Next-up spotlight and help panels |
| Raised surface | `#22231f` | Loading placeholders and quieter controls |
| Muted | `#aaa99f` | Supporting text |
| Divider | `#34362f` | Calendar, list, and section boundaries |
| Accent | `#f15343` | Primary actions, countdowns, current day |
| Positive | `#c4d5a7` | Published schedules and accepted messages |

Controls generally use a 5px radius; major panels use 8px and dialogs 12px. Most primary buttons and icon buttons have a minimum 44px height. Coarse-pointer rules increase compact search and filter controls to 44px. Feedback uses written labels alongside color.

## Screens and information hierarchy

- **Public home:** release-focused headline, anime artwork, a labeled example lineup, explanations of scheduled/waiting/finished states, and ntfy setup steps. Example content illustrates the product; it is not a live user schedule.
- **Sign in and signup:** a desktop split layout pairs artwork with the form. Mobile removes the decorative artwork. Signup can generate a private topic and explains how to subscribe in ntfy.
- **This week:** a next-up spotlight displays title, episode, date, IST time, countdown, and AniList source link. A seven-day agenda begins with today. Only enabled, scheduled, future reminders enter this view.
- **My lineup and Completed:** compact cover rows expose schedule status, timing, source details, pause/resume, and removal. Search, status filters, and sorting support larger collections. Finished and cancelled seasons live in Completed.
- **Discover anime:** a native dialog provides search, loading, error, and empty states. Existing titles stay tracked without changing their pause preference. Finished seasons cannot be added for new release alerts; titles awaiting a schedule can still be followed.
- **Activity:** a paginated delivery log distinguishes queued, sending, accepted, failed, unconfirmed, and skipped outcomes. “Accepted by ntfy” describes provider acceptance; it does not promise device receipt.
- **Settings:** independent morning and airtime preferences, private topic replacement, an explicit test action, sign out, and confirmed account deletion. Saved topics are never returned to the browser. A newly entered topic must be saved before it can be tested.

## Schedule and notification language

All displayed airing times use `Asia/Kolkata` (IST). The calendar lists published dates without predicting weekly recurrences. Countdown copy says “until scheduled airing,” while airtime alerts describe reaching AniList’s published time rather than guaranteeing streaming availability.

| State | Interface label |
| --- | --- |
| Scheduled | Scheduled / Published airing |
| No published future schedule | Awaiting schedule |
| Legacy or unverified record | Checking schedule |
| Provider refresh failure | Update delayed |
| User disabled alerts | Paused |
| Finished season | Season finished |
| Cancelled season | Cancelled |

Adding a title sends no notification. Settings offers a clearly labeled test of the saved topic, limited to one request per minute. Its result can be accepted, failed, or uncertain; uncertain results tell the user to check ntfy before another attempt.

## Responsive and accessible behavior

Desktop uses a fixed 224px sidebar, reduced to 204px at the intermediate breakpoint. At 900px and below, a compact header and five-item bottom navigation replace the sidebar. The footer reserves space for the fixed navigation and device safe area.

The week uses seven columns above 700px and stacked day rows below that width. Lineup controls stack on narrow screens, Settings becomes one column below 750px, and the authentication layout removes its artwork below 720px.

The implementation includes a skip link, visible keyboard focus, labeled form fields and icon controls, `aria-current` navigation, and native modal dialogs with Escape handling and focus restoration. Destructive actions focus the cancel choice first. Reduced-motion preferences disable smooth scrolling and minimize transitions. Covers have a text fallback when an image fails.

## Review boundary

Independent visual inspection covered the populated desktop and mobile week views and Activity loading layouts. The week views showed readable heading, next-up, and calendar hierarchy without visible horizontal clipping. Initial capture fixtures reused one cover for unrelated titles and included the Next.js development issue badge; those are unsuitable as final showcase images.

This document records implemented behavior. Screenshots alone do not verify keyboard interaction, successful provider delivery, current AniList schedule accuracy, or production deployment. Use the repository’s runtime and test evidence for those claims.
