import { createFileRoute, Link } from "@tanstack/react-router";
import {
  IdCard,
  ShieldCheck,
  MapPinned,
  Mic,
  ScanSearch,
  GraduationCap,
  LayoutDashboard,
  Accessibility,
  Sparkles,
  ArrowRight,
  Lock,
  Languages,
  Cpu,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EkID — One Identity. Every Document. Zero Friction." },
      {
        name: "description",
        content:
          "A hackathon pitch for simplifying India's government IDs: a unified, AI-powered, consent-first identity layer for Aadhaar, PAN, Voter ID, Passport and more.",
      },
      { property: "og:title", content: "EkID — Unified Government Identity" },
      {
        property: "og:description",
        content:
          "8 painful gaps in India's identity stack. One elegant, consent-first solution. Built for Bharat.",
      },
    ],
  }),
  component: Index,
});

const gaps = [
  {
    icon: IdCard,
    tag: "Gap 01",
    title: "Repeated Data, Everywhere",
    body: "Aadhaar, PAN, Voter ID, Passport — every portal asks for the same name, DOB, address, parents, mobile. Citizens retype their lives.",
    solution: "One-Time Identity Vault with consent-based API auto-fill via DigiLocker + OCR.",
  },
  {
    icon: ShieldCheck,
    tag: "Gap 02",
    title: "Name Mismatch Chaos",
    body: "“Upasana Roy” vs “Upasana R.” vs “Upasana Roy Chowdhury” — banks freeze, passports stall, scholarships get rejected.",
    solution: "AI Identity Consistency Checker: fuzzy match, mismatch probability, affidavit drafts.",
  },
  {
    icon: MapPinned,
    tag: "Gap 03",
    title: "Address Updates Are Painful",
    body: "Move once → update Aadhaar, PAN, bank, gas, voter, insurance separately. Most people forget half of them.",
    solution: "Unified Address Update Gateway — one form, fan-out to every linked agency with live status.",
  },
  {
    icon: Mic,
    tag: "Gap 04",
    title: "Rural & Elderly Friction",
    body: "Tiny portals. Failed biometrics. Confusing OTPs. The people who need IDs most struggle the most.",
    solution: "Voice-first, multilingual assistant on WhatsApp with offline-friendly mode.",
  },
  {
    icon: ScanSearch,
    tag: "Gap 05",
    title: "Forged & Fake Documents",
    body: "Colleges, employers and landlords still verify PDFs by squinting at them.",
    solution: "Instant Authenticity Scanner — QR + metadata + AI tamper detection in one upload.",
  },
  {
    icon: GraduationCap,
    tag: "Gap 06",
    title: "Students Re-Upload Forever",
    body: "Same marksheet, same photo, same signature — uploaded for every exam, scholarship and hostel form.",
    solution: "Smart Academic Locker with auto-resized assets and verified reusable profiles.",
  },
  {
    icon: LayoutDashboard,
    tag: "Gap 07",
    title: "No Single View of My IDs",
    body: "Is PAN linked to Aadhaar? When does my passport expire? Which mobile is on my voter ID? Nobody knows.",
    solution: "Identity Health Dashboard — expiry alerts, linkage status, risk warnings.",
  },
  {
    icon: Accessibility,
    tag: "Gap 08",
    title: "Inaccessible by Design",
    body: "Government portals are hostile to visually impaired, elderly and motor-impaired users.",
    solution: "Accessibility-first identity layer: voice nav, large UI, screen-reader optimized flows.",
  },
];

const pillars = [
  { icon: Cpu, title: "AI-Native", body: "Fuzzy matching, OCR and tamper detection do the boring work." },
  { icon: Lock, title: "Consent-First", body: "Every share is explicit, scoped, revocable and auditable." },
  { icon: Languages, title: "Built for Bharat", body: "Voice, vernacular and WhatsApp before web portals." },
  { icon: Accessibility, title: "Accessible", body: "Designed with the elderly and disabled as primary users." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="absolute top-0 left-0 right-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <a href="#top" className="flex items-center gap-2 text-primary-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-gold text-gold-foreground font-display text-lg font-bold">
              ē
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">EkID</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-primary-foreground/80 md:flex">
            <a href="#gaps" className="hover:text-gold transition-colors">The Gaps</a>
            <a href="#solution" className="hover:text-gold transition-colors">Solution</a>
            <a href="#pillars" className="hover:text-gold transition-colors">Principles</a>
            <a href="#pitch" className="hover:text-gold transition-colors">Pitch</a>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <a
              href="#pitch"
              className="text-sm font-medium text-primary-foreground/80 hover:text-gold transition-colors"
            >
              Read the pitch
            </a>
            <Link
              to="/login"
              className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-gold-foreground shadow-[var(--shadow-gold)] transition hover:brightness-110"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="bg-hero relative overflow-hidden text-primary-foreground">
        <div className="grain-overlay absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-40 pb-32 lg:grid-cols-12 lg:pt-48 lg:pb-40">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
              <Sparkles className="h-3.5 w-3.5" /> Hackathon Pitch · Government ID Simplification
            </div>
            <h1 className="mt-8 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[5.5rem]">
              One identity.{" "}
              <span className="text-gradient-gold">Every document.</span>{" "}
              Zero friction.
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-primary-foreground/75 sm:text-xl">
              India runs on a dozen government IDs that don't talk to each other. <strong className="text-primary-foreground">EkID</strong> is a consent-first, AI-powered identity layer that unifies them — for citizens, not portals.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#gaps"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-medium text-gold-foreground shadow-[var(--shadow-gold)] transition hover:brightness-110"
              >
                See the 8 gaps <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#solution"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-7 py-3.5 font-medium text-primary-foreground transition hover:bg-primary-foreground/10"
              >
                How it works
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 lg:pt-6">
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: "1.4B", v: "citizens" },
                { k: "12+", v: "core IDs" },
                { k: "0", v: "interoperability" },
                { k: "1", v: "vault to fix it" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-5 backdrop-blur"
                >
                  <div className="font-display text-3xl text-gold">{s.k}</div>
                  <div className="mt-1 text-sm text-primary-foreground/70">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GAPS */}
      <section id="gaps" className="mx-auto max-w-7xl px-6 py-28">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.25em] text-secondary">The problem space</div>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              Eight gaps citizens feel <span className="text-gradient-gold">every single week.</span>
            </h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Each one is a real, recurring failure of India's identity stack — and a hackathon-sized opportunity. Together, they form one product.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {gaps.map((g) => (
            <article
              key={g.tag}
              className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition hover:border-secondary/40 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground transition group-hover:bg-secondary">
                  <g.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-xs tracking-[0.2em] text-gold">{g.tag}</span>
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold leading-snug">{g.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{g.body}</p>
              <div className="mt-5 border-t border-dashed border-border pt-4 text-sm">
                <span className="font-medium text-secondary">Our take · </span>
                <span className="text-foreground/80">{g.solution}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SOLUTION */}
      <section id="solution" className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-28 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="text-xs uppercase tracking-[0.25em] text-gold">The solution</div>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              EkID is the <span className="text-gradient-gold">missing layer</span> between citizens and the State.
            </h2>
            <p className="mt-6 text-primary-foreground/75">
              A single, secure, consent-driven vault that knows every ID you own, keeps them in sync, and lets you share verified facts — not photocopies — with anyone who asks.
            </p>
            <a
              href="#pitch"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-medium text-gold-foreground shadow-[var(--shadow-gold)] transition hover:brightness-110"
            >
              Why judges will love it <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="lg:col-span-7">
            <ol className="relative space-y-6 border-l border-gold/30 pl-8">
              {[
                { t: "Onboard once", d: "Sign in with Aadhaar OTP or DigiLocker. EkID pulls verified IDs you already own." },
                { t: "Vault & reconcile", d: "We detect mismatches across documents and propose corrections with an AI consistency engine." },
                { t: "Share with consent", d: "Any portal, college or landlord requests verified facts via QR — you approve, scoped + time-bound." },
                { t: "Update everywhere", d: "Change your address once. EkID fans the update out to every linked agency and tracks status live." },
              ].map((s, i) => (
                <li key={s.t} className="relative">
                  <span className="absolute -left-[42px] grid h-8 w-8 place-items-center rounded-full bg-gold font-display text-sm font-semibold text-gold-foreground">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-xl">{s.t}</h3>
                  <p className="mt-1 text-primary-foreground/70">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section id="pillars" className="mx-auto max-w-7xl px-6 py-28">
        <div className="text-xs uppercase tracking-[0.25em] text-secondary">Principles</div>
        <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold sm:text-5xl">
          Four non-negotiables that shape every screen.
        </h2>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-cream p-7">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold/20 text-secondary">
                <p.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PITCH / CTA */}
      <section id="pitch" className="bg-hero relative overflow-hidden text-primary-foreground">
        <div className="grain-overlay absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
            <Sparkles className="h-3.5 w-3.5" /> The 30-second pitch
          </div>
          <h2 className="mt-8 font-display text-4xl font-semibold leading-tight sm:text-6xl">
            “India built world-class IDs.{" "}
            <span className="text-gradient-gold">EkID makes them feel like one.”</span>
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-primary-foreground/75">
            Real public impact · AI-powered · Privacy-first · Multilingual · Accessible · Built for the next billion.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="#gaps"
              className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-medium text-gold-foreground shadow-[var(--shadow-gold)] transition hover:brightness-110"
            >
              Revisit the gaps <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#top"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-7 py-3.5 font-medium transition hover:bg-primary-foreground/10"
            >
              Back to top
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-primary text-primary-foreground/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm md:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-gold text-gold-foreground font-display text-sm font-bold">ē</span>
            <span className="font-display text-base text-primary-foreground">EkID</span>
            <span className="ml-3">· A hackathon concept for simplifying government identity.</span>
          </div>
          <div>© {new Date().getFullYear()} EkID team</div>
        </div>
      </footer>
    </div>
  );
}
