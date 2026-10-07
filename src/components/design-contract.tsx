const contract = `<!--
THESIS: A release timeline gives anime fans a dependable place for anticipation, replacing the poster-wall dashboard.
OWN-WORLD: Near-black olive surfaces, warm white text, coral-red actions, Bebas Neue display type, DM Sans controls, compact cover artwork, and clear editorial dividers.
STORY: Find a show, understand its published schedule, follow it, and choose ntfy alerts. Waiting and finished seasons remain visibly quiet.
FIRST VIEWPORT: The public page pairs a large release-focused statement with artwork and a labeled example lineup. The app pairs labeled navigation with a next-episode spotlight and seven-day agenda. Account screens keep setup beside artwork.
FORM: User-approved release timeline direction. Desktop days run across the week; mobile days stack vertically. Public examples remain illustrative, status labels communicate evidence, and settings offer an explicit notification test.
-->`;

export function DesignContract() {
  return <div hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: contract }} />;
}
