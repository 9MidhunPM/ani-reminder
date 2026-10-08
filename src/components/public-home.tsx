import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowRight, ArrowUpRight, BellRing, Check, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Brand } from "@/components/ui";
import { HomeExperience, LineupPreview, MotionToggle } from "@/components/home-motion";

export function PublicHome({ isAuthenticated }: { isAuthenticated: boolean }) {
  const destination = isAuthenticated ? "/dashboard" : "/signup";
  return <HomeExperience>
    <a href="#how-it-works" className="skip-link">Skip to how it works</a>
    <div className="cinema-scroll-progress" aria-hidden="true" />
    <header className="cinema-header"><Brand /><nav aria-label="Main navigation"><a href="#the-lineup" className="cinema-nav-preview">The experience</a>{!isAuthenticated && <Link href="/login">Sign in</Link>}<Link href={destination} className="cinema-nav-cta">{isAuthenticated ? "Open lineup" : "Get started"}<ArrowUpRight size={16} /></Link></nav></header>
    <section className="cinema-hero" data-motion-region>
      <div className="cinema-hero-copy"><p className="cinema-kicker"><span className="cinema-live-dot cinema-loop" />For the love of the next episode.</p>
        <h1 className="title-font cinema-title"><span className="cinema-title-line"><span>THE WAIT.</span></span><span className="cinema-title-line"><span>IS PART OF</span></span><span className="cinema-title-line cinema-title-accent"><span>THE STORY.</span></span></h1>
        <p className="cinema-description">The worlds you get lost in.<br />The next episodes you won’t lose track of.</p><p className="cinema-description-detail">Your anime, one lineup, and release alerts that know when the season is over.</p>
        <div className="cinema-hero-actions"><Link href={destination} className="cinema-button cinema-button-primary"><span>{isAuthenticated ? "Back to your lineup" : "Build my lineup"}</span><ArrowUpRight size={20} /></Link><a href="#the-lineup" className="cinema-explore">See it in action<ArrowDown size={16} /></a></div>
        <div className="cinema-source-line"><span>Schedules by AniList</span><i /><span>Alerts through ntfy</span><span className="cinema-timezone">Made for your week. In IST.</span></div>
      </div>
      <div className="cinema-scene" aria-label="Anime poster collage">
        <div className="cinema-disc" aria-hidden="true"><span className="cinema-disc-type">NEXT<br />EPISODE</span><div className="cinema-orbit cinema-loop" /></div>
        <div className="cinema-scene-coordinate" aria-hidden="true">GOOD STORIES.<br />WORTH THE WAIT.</div>
        <div className="cinema-poster-field">
          <figure className="cinema-poster cinema-poster-back"><div className="cinema-poster-float cinema-loop"><Image src="/artwork/one-piece.jpg" alt="One Piece artwork" fill sizes="(max-width: 700px) 32vw, 220px" /><figcaption>One Piece<span>Adventure, on repeat.</span></figcaption></div></figure>
          <figure className="cinema-poster cinema-poster-side"><div className="cinema-poster-float cinema-loop"><Image src="/artwork/dandadan.jpg" alt="Dandadan artwork" fill sizes="(max-width: 700px) 34vw, 240px" /><figcaption>Dandadan<span>A little out of this world.</span></figcaption></div></figure>
          <figure className="cinema-poster cinema-poster-main"><div className="cinema-poster-float cinema-loop"><Image src="/artwork/frieren.jpg" alt="Frieren: Beyond Journey’s End artwork" fill priority sizes="(max-width: 700px) 44vw, 290px" /><figcaption>Frieren<span>Stay for the journey.</span></figcaption></div></figure>
        </div>
        <div className="cinema-alert cinema-loop"><span className="cinema-alert-icon"><BellRing size={21} /></span><div><span>EXAMPLE ALERT</span><strong>Your Sunday show</strong><p>Episode 12 · Published airing time</p></div><Check size={17} /></div>
        <div className="cinema-scene-footer"><span>YOUR FAVORITES. YOUR OWN PACE.</span><Sparkles size={16} /></div>
      </div>
      <div className="cinema-hero-foot"><a href="#the-lineup"><ArrowDown size={14} />Scroll for the good part</a><MotionToggle /></div>
    </section>
    <div className="cinema-marquee" data-motion-region aria-hidden="true"><div className="cinema-marquee-track cinema-loop">{[0, 1].map(index => <div className="cinema-marquee-copy" key={index}><span>ONE MORE EPISODE.</span><i>✦</i><span className="cinema-marquee-outline">ONE CLEAR LINEUP.</span><i>✦</i></div>)}</div></div>
    <section id="the-lineup" className="cinema-lineup-section" data-reveal="lineup">
      <div className="cinema-section-intro"><p className="cinema-section-label">THE PLOT, WITHOUT THE GUESSWORK.</p><h2 className="title-font">A LITTLE ORDER.<br /><span>A LOT TO LOOK<br className="cinema-desktop-break" /> FORWARD TO.</span></h2><p>A seven-day view of what’s actually scheduled. A home for shows taking a break. A proper ending for finished seasons.</p><Link href={destination} className="cinema-text-link">Make room for your favorites<ArrowUpRight size={17} /></Link></div>
      <LineupPreview />
    </section>
    <section className="cinema-quiet-section" data-reveal="quiet" data-motion-region>
      <div className="cinema-quiet-art"><Image src="/artwork/frieren.jpg" alt="" fill sizes="(max-width: 700px) 90vw, 44vw" /><div className="cinema-art-vignette" /><span className="cinema-frame-corner cinema-frame-one" /><span className="cinema-frame-corner cinema-frame-two" /><p className="cinema-quiet-caption">Every good story<br />deserves its own pace.</p><div className="cinema-art-rule cinema-loop" /></div>
      <div className="cinema-quiet-copy"><span className="cinema-section-label">ANTICIPATION. WITHOUT THE NOISE.</span><h2 className="title-font">WE KNOW<br />WHEN TO<br /><span>GO QUIET.</span></h2><p>No published next episode? No invented date. Season finished? No endless weekly alerts. Just a lineup that knows where the story stands.</p><div className="cinema-quiet-detail"><Check size={18} /><span>Real schedules. Clear episode numbers. Room to wait.</span></div></div>
    </section>
    <section id="how-it-works" className="cinema-setup" data-reveal="setup"><div className="cinema-setup-title"><div><span className="cinema-section-label">YOUR OPENING SEQUENCE.</span><h2 className="title-font">LESS SETUP.<br /><span>MORE STORY.</span></h2></div><p>Three small steps.<br />Then back to your next favorite.</p></div><ol className="cinema-steps"><li><span className="cinema-step-number">01</span><Search size={25} /><h3>Find your next obsession.</h3><p>Search AniList. Follow your favorites, including shows whose next airing hasn’t been announced.</p></li><li><span className="cinema-step-number">02</span><BellRing size={25} /><h3>Give it a way to find you.</h3><p>Choose a private topic, subscribe in ntfy, and send a test from Settings.</p><a href="https://ntfy.sh/docs/subscribe/phone/" target="_blank" rel="noreferrer">The ntfy setup guide<ArrowUpRight size={14} /></a></li><li><span className="cinema-step-number">03</span><SlidersHorizontal size={25} /><h3>Make it your kind of quiet.</h3><p>Morning reminders, airtime alerts, or both. Pause any show whenever you need a break.</p></li></ol></section>
    <section className="cinema-close" data-reveal="close" data-motion-region><div className="cinema-close-orbit cinema-loop" aria-hidden="true" /><span className="cinema-section-label">THE NEXT CHAPTER IS YOURS.</span><h2 className="title-font">SEE YOU<br /><span>NEXT EPISODE.</span></h2><div className="cinema-close-bottom"><p>Your seat is saved.<br />Bring the shows you can’t stop thinking about.</p><Link href={destination} className="cinema-button cinema-button-dark"><span>{isAuthenticated ? "Open your lineup" : "Create your account"}</span><ArrowUpRight size={21} /></Link></div></section>
    <footer className="cinema-footer"><Brand /><p>Published airing times, not streaming availability.<br />Built for the shows you look forward to.</p><a href="#main-content">Back to the opening<ArrowRight size={15} /></a></footer>
    <noscript><style>{`.motion-toggle,.preview-tabs,.preview-note { display:none !important; } .cinema-home *, .cinema-home *::before, .cinema-home *::after { animation:none !important; transition:none !important; }`}</style></noscript>
  </HomeExperience>;
}
