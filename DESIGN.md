---
name: AniReminder
description: Anticipation with a dependable place in the week.
colors:
  accent: "#f15343"
  accent-hover: "#ff6959"
  background: "#111210"
  foreground: "#f4f1e9"
  surface: "#191a17"
  surface-raised: "#22231f"
  muted: "#aaa99f"
  divider: "#34362f"
  positive: "#c4d5a7"
  cinema-paper: "#f1eee6"
  cinema-light: "#e9e9dc"
  preview-surface: "#1b1e17"
typography:
  cinema-display:
    fontFamily: "Bebas Neue, sans-serif"
    fontSize: "clamp(64px, 7.1vw, 96px)"
    fontWeight: 400
    lineHeight: 0.93
    letterSpacing: "-0.015em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "15px"
    lineHeight: 1.6
  eyebrow:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 650
    letterSpacing: "0.14em"
rounded:
  cinema: "3px"
  control: "5px"
  panel: "8px"
  dialog: "12px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#151510"
    rounded: "{rounded.control}"
    padding: "11px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  cinema-button:
    backgroundColor: "{colors.accent}"
    textColor: "#171813"
    rounded: "{rounded.cinema}"
    padding: "0 23px"
  preview:
    backgroundColor: "{colors.preview-surface}"
    rounded: "{rounded.dialog}"
    padding: "25px"
---

# Design System: AniReminder

## Overview

**Creative North Star: "The next-episode opening"**

AniReminder gives anticipation a clear place in the week. Its identity combines near-black olive surfaces, warm white type, coral red actions, condensed display lettering, and real anime artwork. The voice stays direct about release dates and quiet about unannounced episodes.

The public homepage uses the user's chosen cinematic anime opening: a coral disc, three overlapping posters, sweeping typography, and a moving editorial strip. This expressive welcome leads into a working example of the product. The authenticated application keeps its release timeline and compact controls; homepage choreography does not become a requirement for everyday tasks.

**Key Characteristics:**

- Large condensed display type with concise supporting copy.
- Red as the public focal material and the application action color.
- Real title artwork, clearly separated from illustrative schedule data.
- A rehearsed opening followed by quieter product proof and setup.
- Explicit motion controls and a complete static presentation.

## Colors

The palette combines warm ink and paper with a sharp coral accent. Values in the frontmatter reflect the implemented stylesheets.

### Primary

- **Coral red:** primary actions, emphasized homepage lines, the poster disc, moving strip, and closing invitation.
- **Bright coral:** hover feedback for the application primary button.

### Neutral

- **Olive ink:** page canvas and cinematic background.
- **Warm white:** primary text and quiet high-contrast surfaces.
- **Layered olive surfaces:** the application's next-up panel, placeholders, settings help, and homepage example.
- **Warm gray:** supporting copy; dividers use a darker olive gray.
- **Cinema paper:** light lettering and button hover sweep on the public page.
- **Light olive paper:** the homepage's full-width quiet-state section.

### Supporting state color

- **Pale green:** confirmed schedules and accepted-message feedback. Written labels accompany status colors.

**The Evidence Rule.** Artwork and accent color convey atmosphere; only written schedule states establish release evidence.

## Typography

**Display Font:** Bebas Neue, with sans-serif fallback.

**Body Font:** DM Sans, with sans-serif fallback.

Bebas Neue gives titles, dates, and the moving strip their condensed, confident form. DM Sans carries controls, explanations, episode details, and small editorial labels. Display lettering creates the spectacle while body text explains the product.

The public opening uses three masked headline lines. Its desktop display size and metrics are captured in the frontmatter; mobile uses a viewport-based size with a minimum of 65px. Other homepage section headings vary from 50px to 96px according to their role and viewport. Supporting paragraphs remain compact and generally stay within 40–49 characters per line.

Application controls use restrained 11–15px text. Episode timing and countdowns use tabular numerals where numbers change. Uppercase eyebrows identify a section; they do not replace headings or field labels.

## Layout

The public canvas is centered with a maximum width of 1800px. The homepage uses 5.5% side gutters and a balanced desktop opening: headline and action on the left, poster scene on the right. The poster stack sits directly in the page rather than inside a dashboard card. A tilted red strip separates the opening from product proof.

The next passage pairs explanatory display type with an interactive lineup example. A contrasting light section pairs a large Frieren crop with the quiet-state message. Setup uses three editorial columns, followed by a red closing invitation. These changes in density and material pace the scroll.

At 700px and below, the public sections stack. The main action remains before the artwork, the poster composition retains its layered silhouette, preview controls stay within the panel, setup becomes a vertical list, and the closing action follows its copy. The normal mobile composition has no horizontal overflow. The fixed motion control sits above the device safe area; extra footer clearance keeps the final navigation link above it.

The application continues to use a fixed 224px sidebar, reduced to 204px at its intermediate breakpoint. At 900px and below, a compact header and five-item bottom navigation replace it. The week uses seven columns above 700px and stacked day rows below. Settings stacks below 750px; authentication removes decorative artwork below 720px. The application footer reserves space for fixed navigation and the device safe area.

## Elevation & Depth

The application primarily uses tonal layering and thin editorial dividers. Shadows identify modal depth rather than lifting every row. The public poster scene deliberately adds physical overlap, small rotations, a coral disc, and soft shadows beneath artwork and the sample alert. Pointer depth and scroll displacement affect the decorative poster field, leaving text and actions stable.

### Shadow vocabulary

- **Poster:** `12px 22px 30px #05060480` anchors the tilted artwork.
- **Example alert:** `8px 15px 30px #0005` separates the paper notification from its posters.
- **Motion control:** `4px 6px 18px #0005` keeps the fixed control legible over varied sections.
- **Dialog:** `0 24px 70px rgba(0,0,0,.35)` establishes the application's modal layer.

## Shapes

Controls use gently cut corners. The homepage's main actions and posters use the tighter cinema radius; application buttons and fields use the control radius. Larger application surfaces use the panel radius. Dialogs and the interactive homepage example use the dialog radius.

Circles belong to the homepage's poster disc, orbit, and closing rings, or to small status icons. Thin dividers organize editorial content. The layout does not turn every explanation into a card.

## Components

### Homepage opening and motion

The opening brings three title lines and three real posters into place once. Nested poster layers then drift slowly; an orbit, example alert, tilted text strip, artwork sweep, and closing rings add continuous motion. The pointer gently changes poster perspective, and scrolling displaces only the artwork. Section entrances use different, bounded treatments: a turning preview, a cropped artwork reveal, a short setup stagger, and a closing text wipe.

The persistent **Pause motion** control pauses the decorative sequence and remembers the choice locally. The system's reduced-motion preference takes priority, disables animation and transitions, and keeps every section visible. Loops pause when their region leaves the viewport or the document is hidden. Content is server rendered and remains usable without JavaScript; no sound or autoplay video is used.

### Buttons and navigation

Application buttons retain their existing primary, secondary, quiet, and danger variants. Public primary actions use the tighter cinema shape, a paper-colored hover sweep, and a small arrow movement. Header navigation remains plain and readable, with a clear account action. Signed-in visitors are sent to their lineup; other visitors are sent to signup. Primary controls and preview tabs have at least a 44px target.

### Illustrative lineup

The example is explicitly labeled and never sends notifications. Scheduled, Waiting, and Completed tabs change the episode explanation and weekly marks. Tabs support pointer selection, arrow keys, Home, and End, with a single tab stop and a labeled panel. The calendar marks illustrate the selected state; they are not current AniList data.

### Authenticated release timeline

The next-up spotlight displays a title, episode, published date, IST time, countdown, and AniList source link. Only enabled, scheduled future airings enter the seven-day agenda. Compact lineup rows expose schedule status, pause/resume, and removal; search, status filters, and sorting support larger collections. Finished and cancelled seasons live in Completed.

The interface distinguishes Scheduled, Awaiting schedule, Checking schedule, Update delayed, Paused, Season finished, and Cancelled. Countdowns say "until scheduled airing." No interface invents a weekly recurrence after an announced episode.

### Forms, dialogs, and delivery feedback

Fields have visible labels, a 46px minimum height, dark surfaces, and clear focus treatment. Native search and confirmation dialogs provide Escape handling and focus restoration; destructive confirmations focus cancellation first. Failed covers retain a text fallback.

Settings separates morning and airtime preferences, private topic replacement, an explicit test, and account deletion. Adding an anime sends no notification. Saved topics are never returned to the browser, and a new topic must be saved before testing. Activity distinguishes queued, sending, accepted, failed, unconfirmed, and skipped messages. "Accepted by ntfy" describes provider acceptance rather than device receipt.

### Inspection boundary

The cinematic homepage was independently reviewed in two bounded capture rounds, each covering desktop and mobile with normal motion and reduced motion. The final set confirms a complete composition, readable actions, and static reduced-motion content. The second round followed footer clearance and no-JavaScript copy corrections. Normal viewport captures can freeze the poster entrance at partial opacity; full-page and reduced-motion captures show the final solid artwork. Fixed controls appear at the captured viewport position within full-page images, so actual viewport overlap also needs runtime checks. Fourteen homepage browser cases passed, including the final footer link's clearance and activation.

The earlier release-timeline design review covered fourteen desktop/mobile captures across Home, Sign in, Signup, This week, Discover, Settings, and Activity. Those application surfaces were outside this homepage redesign and were not independently re-reviewed here. Screenshots establish visual layout, while runtime tests establish keyboard interaction, motion preferences, and navigation. Neither establishes current provider data, phone delivery, or deployment of a particular revision.

## Do's and Don'ts

### Do

- **Do** reserve cinematic choreography for the public welcome and keep application tasks quick.
- **Do** retain the real poster artwork and clear title association.
- **Do** label invented preview schedules and sample alerts as examples.
- **Do** keep the main lineup action readable and reachable during motion.
- **Do** show complete content with reduced motion and without JavaScript.
- **Do** preserve the pause control, visible keyboard focus, and 44px interaction targets.
- **Do** describe published airing times in IST and preserve quiet waiting/completed states.

### Don't

- **Don't** present the homepage's example episode or calendar as live schedule data.
- **Don't** let poster layers capture interaction intended for a real control.
- **Don't** autoplay sound or make visitors wait through a sequence before using the page.
- **Don't** animate date or episode values to imply a provider update.
- **Don't** hide essential content behind hydration, a reveal observer, or a motion preference.
- **Don't** carry homepage loops into routine account or lineup work.
- **Don't** describe ntfy acceptance as confirmation that a phone displayed a message.
