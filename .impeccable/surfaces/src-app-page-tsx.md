---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["route:/","src/components/public-home.tsx","src/components/home-motion.tsx","src/app/home.css"]
---

# Public homepage

## Scope and mode

Route `/`, implemented by `src/components/public-home.tsx` with the small motion and preview island in `src/components/home-motion.tsx`. Visitor mode: **Persuade**. This scope changes the public welcome; dashboard, authentication, scheduler, and notification behavior retain their existing contracts.

## Visitor and action

Anime fans arriving for the first time should understand that AniReminder organizes published episode dates, retains shows awaiting a schedule, and stops release alerts when a season finishes. The main action creates an account; authenticated visitors go to their lineup. The secondary action reaches the interactive example.

## Chosen direction

The user chose **Cinematic anime opening — bold red, layered posters, sweeping motion**. The memorable opening combines masked display lines with three real anime posters over a coral disc, an orbit, and a clearly labeled sample notification. The page progresses through a tilted moving strip, interactive lineup proof, a quieter artwork-led explanation, compact setup, and a decisive red close.

## Proof and constraints

- The Scheduled, Waiting, and Completed preview is illustrative and sends no notification.
- The artwork identifies actual titles but does not establish their current release schedule.
- Keep the account action before the poster scene on mobile.
- Keep text/actions stable while decorative depth and scroll motion affect the poster field.
- Preserve the persistent pause control, local preference, system reduced motion, offscreen/hidden loop suspension, keyboard tabs, and static server-rendered content.
- Keep the final footer link above the fixed motion control at the end of the page.
- Use the product's real AniList, ntfy, IST, and quiet-season behavior; add no customer, benchmark, or streaming-availability claims.

## Review boundary

Independent review uses the root-provided desktop/mobile normal-motion and reduced-motion capture batches. Runtime tests cover navigation, preview keyboard behavior, pause persistence, system preference changes, offscreen loops, static content, and final-control clearance. Screenshots do not prove current provider data or phone delivery.

## Unresolved decisions

None for this homepage direction. Future public-page work should preserve the selected opening and its motion controls unless the user requests a new direction.
