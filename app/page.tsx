"use client";
import React, { CSSProperties, useEffect, useState } from "react";

/* ── Theme ─────────────────────────────────────────── */
function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const d = stored !== "light"; // dark by default
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  return { dark, toggle };
}

/* ── Tokens (exact app palette) ────────────────────── */
type Tok = {
  bg: string; bg2: string; card: string;
  text: string; muted: string;
  border: string; border2: string;
  secondary: string; navBg: string;
};
function useTokens(dark: boolean): Tok {
  return dark ? {
    bg: "#0f172a", bg2: "#1e293b", card: "#1e293b",
    text: "#f1f5f9", muted: "#94a3b8",
    border: "#334155", border2: "#1e293b",
    secondary: "#2dd4bf",
    navBg: "rgba(15,23,42,0.75)",
  } : {
    bg: "#f8fafc", bg2: "#f1f5f9", card: "#ffffff",
    text: "#0f172a", muted: "#64748b",
    border: "#cbd5e1", border2: "#e2e8f0",
    secondary: "#0d9488",
    navBg: "rgba(248,250,252,0.80)",
  };
}

/* ── Icons ─────────────────────────────────────────── */
const Sun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const Moon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const Check = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const FeatureIcons: Record<string, React.ReactNode> = {
  map: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>,
  clock: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  payment: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  shield: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  bell: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  phone: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>,
};

/* ── Data — honest, user-friendly copy ─────────────── */
const stats = [
  { v: "₹0", l: "Barrier hardware needed" },
  { v: "< 2s", l: "Vehicle verified on entry" },
  { v: "100%", l: "Cashless checkout" },
  { v: "24/7", l: "Lot monitoring" },
];

const features = [
  {
    k: "map",
    t: "Find parking near you",
    d: "Open the app and see available lots near your location — before you even start driving. No more circling blocks looking for a spot.",
  },
  {
    k: "clock",
    t: "Book in advance or on the go",
    d: "Reserve a slot ahead of time or just show up. Either way, a spot is waiting for you when you arrive.",
  },
  {
    k: "payment",
    t: "Pay only for the time you use",
    d: "Billing starts when you enter and stops when you leave. No round-up to the next hour. No hidden charges. UPI checkout in seconds.",
  },
  {
    k: "shield",
    t: "Your vehicle is always tracked",
    d: "Your slot is logged the moment you park. No one else can take it, and you have a full record of every session.",
  },
  {
    k: "bell",
    t: "Get notified before time runs out",
    d: "Running late? The app lets you know before your booked time ends so you can extend — without rushing back to feed a meter.",
  },
  {
    k: "phone",
    t: "Everything from your phone",
    d: "Find, book, enter, exit and pay — all from a single app. No paper tickets to lose, no machines to figure out.",
  },
];

const steps = [
  { n: "01", t: "Find a spot near you", d: "Open ParkInToday and see available parking lots on a live map around your location." },
  { n: "02", t: "Pick your slot and book", d: "Choose the lot, select how long you need, and confirm. Done in a few taps." },
  { n: "03", t: "Drive in", d: "Your vehicle is recognised when you arrive. No ticket to collect, no barrier to fight with." },
  { n: "04", t: "Park for as long as you need", d: "The app quietly tracks your session in the background. You can close it completely." },
  { n: "05", t: "Drive out and pay", d: "Billing stops when you leave. Tap once in any UPI app and you're done." },
];

const bullets = [
  "India has over 300 million registered vehicles with almost no organised, app-based parking — the opportunity is wide open.",
  "No expensive barrier systems needed — our software works with cameras already present in most modern lots.",
  "Subscription revenue from lot operators plus a small fee on each transaction — two steady income streams.",
  "Most parking apps in India target metros. We're focused on Tier-2 cities where affordable solutions don't exist yet.",
  "Every booking makes the system smarter — improving accuracy and cutting manual effort for operators over time.",
  "Once drivers adopt ParkInToday for daily parking, expansion to subscriptions, corporate passes and EV bays is natural.",
];

/* ── Style helpers ──────────────────────────────────── */
const WRAP: CSSProperties = { maxWidth: 1060, margin: "0 auto", padding: "0 24px" };
const SEC: CSSProperties = { padding: "96px 0" };

function lbl(tok: Tok): CSSProperties {
  return { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: tok.muted, marginBottom: 18 };
}
function disp(): CSSProperties {
  return { fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.2rem,4.5vw,3.4rem)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.03em" };
}
function crd(tok: Tok, extra: CSSProperties = {}): CSSProperties {
  const shadow = tok.bg === "#0f172a" ? "0 1px 4px rgba(0,0,0,0.35)" : "0 1px 3px rgba(0,0,0,0.06)";
  return { background: tok.card, border: `1px solid ${tok.border}`, borderRadius: 14, padding: "24px 22px", boxShadow: shadow, transition: "box-shadow 0.2s, transform 0.2s", ...extra };
}

/* ── Pill Navbar ────────────────────────────────────── */
function Nav({ tok, dark, toggle }: { tok: Tok; dark: boolean; toggle: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    /* Outer band — full width, transparent, positions pill */
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", justifyContent: "center",
      padding: "14px 20px",
      pointerEvents: "none",
    }}>
      {/* Pill */}
      <nav style={{
        pointerEvents: "all",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 24,
        width: "100%", maxWidth: 860,
        padding: "8px 12px 8px 14px",
        borderRadius: 999,
        background: tok.navBg,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${scrolled ? tok.border : tok.border2}`,
        boxShadow: scrolled
          ? `0 8px 32px rgba(0,0,0,${dark ? "0.45" : "0.1"})`
          : `0 2px 8px rgba(0,0,0,${dark ? "0.25" : "0.04"})`,
        transition: "box-shadow 0.3s, border-color 0.3s",
      }}>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="ParkInToday" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover" }} />
          <span style={{ fontWeight: 700, fontSize: "0.9rem", letterSpacing: "-0.02em", color: tok.text }}>
            ParkIn<span style={{ opacity: 0.4 }}>Today</span>
          </span>
        </a>

        {/* Links */}
        <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
          {[["How it Works", "#how-it-works"], ["Features", "#features"], ["For Investors", "#investors"]].map(([n, h]) => (
            <a key={n} href={h}
              style={{ fontSize: "0.84rem", fontWeight: 500, color: tok.muted, transition: "color 0.15s", whiteSpace: "nowrap" }}
              onMouseEnter={e => (e.currentTarget.style.color = tok.text)}
              onMouseLeave={e => (e.currentTarget.style.color = tok.muted)}
            >{n}</a>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <button onClick={toggle} aria-label="Toggle theme" style={{
            width: 32, height: 32, borderRadius: 999,
            border: `1px solid ${tok.border}`, background: tok.bg2, color: tok.text,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>{dark ? <Sun /> : <Moon />}</button>

          <a href="#contact" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 16px", borderRadius: 999,
            background: tok.text, color: tok.bg,
            fontWeight: 600, fontSize: "0.82rem",
            fontFamily: "'Space Grotesk', sans-serif",
            transition: "opacity 0.15s", whiteSpace: "nowrap",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.78")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >Get Early Access</a>
        </div>
      </nav>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────  */
function Hero({ tok }: { tok: Tok }) {
  const teal = tok.bg === "#0f172a" ? "#2dd4bf" : "#0d9488";
  const isDark = tok.bg === "#0f172a";
  const heroBg = isDark
    ? `
        radial-gradient(ellipse 55% 45% at 15% 55%, #0d948820, transparent 60%),
        radial-gradient(ellipse 50% 55% at 80% 20%, #7c3aed28, transparent 55%),
        radial-gradient(ellipse 40% 40% at 65% 75%, #0e749018, transparent 55%),
        radial-gradient(ellipse 60% 40% at 40% 10%, #2563eb18, transparent 60%),
        #0f172a
      `
    : `
        radial-gradient(ellipse 55% 45% at 15% 55%, #0d948814, transparent 60%),
        radial-gradient(ellipse 50% 55% at 80% 20%, #7c3aed12, transparent 55%),
        radial-gradient(ellipse 40% 40% at 65% 75%, #0e749010, transparent 55%),
        radial-gradient(ellipse 60% 40% at 40% 10%, #2563eb0e, transparent 60%),
        #f8fafc
      `;
  return (
    <section style={{
      ...SEC, paddingTop: 152, paddingBottom: 96,
      background: heroBg,
    }}>
      <div style={WRAP}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          {/* Left */}
          <div>
            <p style={lbl(tok)}>🇮🇳 Available in Chennai</p>
            <h1 style={{ ...disp(), marginBottom: 22 }}>
              Park your vehicle,<br />
              <span style={{ fontStyle: "normal" }}>on your terms.</span>
            </h1>
            <p style={{ fontSize: "clamp(0.95rem,1.8vw,1.05rem)", color: tok.muted, lineHeight: 1.75, marginBottom: 36 }}>
              Find a parking spot near you, book it in a few taps, drive straight in —
              and pay only for the time you actually use. No tickets, no queues, no cash.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#how-it-works" style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "11px 22px", borderRadius: 999,
                background: tok.text, color: tok.bg,
                fontWeight: 600, fontSize: "0.9rem",
                fontFamily: "'Space Grotesk', sans-serif", transition: "opacity 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >See How It Works <Arrow /></a>
              <a href="#investors" style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "11px 22px", borderRadius: 999,
                background: "transparent", color: tok.text,
                border: `1px solid ${tok.border}`,
                fontWeight: 600, fontSize: "0.9rem",
                fontFamily: "'Space Grotesk', sans-serif", transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = tok.bg2)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >For Investors</a>
            </div>
          </div>

          {/* Right — stat cards 2×2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {stats.map((s, i) => (
              <div key={i} style={crd(tok, { padding: "22px 20px" })}>
                <div style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "2.1rem", fontWeight: 400,
                  letterSpacing: "-0.04em", lineHeight: 1,
                  color: teal,
                }}>{s.v}</div>
                <div style={{ fontSize: "0.8rem", color: tok.muted, marginTop: 8, lineHeight: 1.4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How it works ───────────────────────────────────── */
function HowItWorks({ tok }: { tok: Tok }) {
  return (
    <section id="how-it-works" style={{ ...SEC, borderTop: `1px solid ${tok.border2}` }}>
      <div style={WRAP}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: 80, alignItems: "start" }}>
          <div style={{ position: "sticky", top: 90 }}>
            <p style={lbl(tok)}>How it works</p>
            <h2 style={{ ...disp(), marginBottom: 18 }}>
              Parking done<br />
              <span style={{ fontStyle: "normal" }}>in five steps.</span>
            </h2>
            <p style={{ fontSize: "0.95rem", color: tok.muted, lineHeight: 1.7 }}>
              From opening the app to driving away — the whole experience fits in your palm.
              You never need to touch a machine or handle cash.
            </p>
          </div>
          <div>
            {steps.map((s, i) => (
              <div key={i} style={{
                display: "flex", gap: 18, padding: "24px 0",
                borderBottom: i < steps.length - 1 ? `1px solid ${tok.border2}` : "none",
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: tok.bg2, border: `1px solid ${tok.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.72rem", fontWeight: 700, color: tok.muted, flexShrink: 0,
                }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 6 }}>{s.t}</div>
                  <div style={{ fontSize: "0.875rem", color: tok.muted, lineHeight: 1.65 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Features ───────────────────────────────────────── */
function Features({ tok }: { tok: Tok }) {
  const sdw = tok.bg === "#0f172a" ? "0 8px 24px rgba(0,0,0,0.45)" : "0 8px 24px rgba(0,0,0,0.1)";
  return (
    <section id="features" style={{ ...SEC, borderTop: `1px solid ${tok.border2}` }}>
      <div style={WRAP}>
        <p style={lbl(tok)}>Features</p>
        <h2 style={{ ...disp(), marginBottom: 12 }}>
          Everything you need<br />
          <span style={{ fontStyle: "normal" }}>to park without the hassle.</span>
        </h2>
        <p style={{ fontSize: "0.95rem", color: tok.muted, lineHeight: 1.7, marginBottom: 52, maxWidth: 500 }}>
          We built ParkInToday around a simple idea — parking should be the last thing on your mind.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 14 }}>
          {features.map((f, i) => (
            <div key={i} style={crd(tok)}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-3px)"; el.style.boxShadow = sdw; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = ""; el.style.boxShadow = tok.bg === "#0f172a" ? "0 1px 4px rgba(0,0,0,0.35)" : "0 1px 3px rgba(0,0,0,0.06)"; }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 9,
                background: tok.bg2, border: `1px solid ${tok.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14, color: tok.text,
              }}>{FeatureIcons[f.k]}</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 8 }}>{f.t}</div>
              <div style={{ fontSize: "0.875rem", color: tok.muted, lineHeight: 1.65 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Investors ──────────────────────────────────────── */
function Investors({ tok }: { tok: Tok }) {
  return (
    <section id="investors" style={{ ...SEC, borderTop: `1px solid ${tok.border2}` }}>
      <div style={WRAP}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <div>
            <p style={lbl(tok)}>For investors</p>
            <h2 style={{ ...disp(), marginBottom: 20 }}>
              A massive market,<br />
              <span style={{ fontStyle: "normal" }}>still waiting to be solved.</span>
            </h2>
            <p style={{ fontSize: "0.95rem", color: tok.muted, lineHeight: 1.75, marginBottom: 32 }}>
              Parking in Indian cities is overwhelmingly unorganised — cash-only, manual, and impossible to navigate.
              ParkInToday brings it online: bookable, trackable, and cashless — for both drivers and lot owners.
            </p>
            <a href="mailto:invest@parkintoday.com" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 999,
              background: tok.text, color: tok.bg,
              fontWeight: 600, fontSize: "0.9rem",
              fontFamily: "'Space Grotesk', sans-serif", transition: "opacity 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >Request Pitch Deck <Arrow /></a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bullets.map((b, i) => (
              <div key={i} style={crd(tok, { display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 18px" })}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: tok.bg2, border: `1px solid ${tok.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, color: tok.muted, marginTop: 1,
                }}><Check /></div>
                <p style={{ fontSize: "0.875rem", color: tok.muted, lineHeight: 1.65 }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA ────────────────────────────────────────────── */
function CTA({ tok }: { tok: Tok }) {
  return (
    <section id="contact" style={{ ...SEC, borderTop: `1px solid ${tok.border2}` }}>
      <div style={WRAP}>
        <div style={{ background: tok.text, borderRadius: 20, padding: "64px 48px", textAlign: "center" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: tok.bg, opacity: 0.4, marginBottom: 18 }}>
            Now live · Chennai
          </p>
          <h2 style={{
            fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
            fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 400,
            color: tok.bg, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16,
          }}>
            Be among the first<br /><span style={{ fontStyle: "normal" }}>to park smarter.</span>
          </h2>
          <p style={{ fontSize: "0.95rem", color: tok.bg, opacity: 0.55, maxWidth: 420, margin: "0 auto 36px", lineHeight: 1.7 }}>
            We&apos;re onboarding parking lots and early users in Chennai right now.
            Join the waitlist and we&apos;ll reach out directly.
          </p>
          <a href="mailto:hello@parkintoday.com" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 24px", borderRadius: 999,
            background: tok.bg, color: tok.text,
            fontWeight: 700, fontSize: "0.9rem",
            fontFamily: "'Space Grotesk', sans-serif", transition: "opacity 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >Join the Waitlist <Arrow /></a>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────── */
function Footer({ tok }: { tok: Tok }) {
  return (
    <footer style={{ borderTop: `1px solid ${tok.border2}`, padding: "36px 0" }}>
      <div style={{ ...WRAP, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="ParkInToday" style={{ width: 26, height: 26, borderRadius: 7, objectFit: "cover" }} />
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: tok.text }}>ParkInToday</span>
        </div>
        <div style={{ fontSize: "0.8rem", color: tok.muted }}>© {new Date().getFullYear()} ParkInToday. All rights reserved.</div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: "0.8rem", color: tok.muted, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = tok.text)}
              onMouseLeave={e => (e.currentTarget.style.color = tok.muted)}
            >{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ── Page ───────────────────────────────────────────── */
export default function Page() {
  const { dark, toggle } = useTheme();
  const tok = useTokens(dark);
  return (
    <div style={{ background: tok.bg, color: tok.text, minHeight: "100vh", transition: "background 0.2s, color 0.2s" }}>
      <Nav tok={tok} dark={dark} toggle={toggle} />
      <Hero tok={tok} />
      <HowItWorks tok={tok} />
      <Features tok={tok} />
      <Investors tok={tok} />
      <CTA tok={tok} />
      <Footer tok={tok} />
    </div>
  );
}
