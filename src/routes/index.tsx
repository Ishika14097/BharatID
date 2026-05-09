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
  CheckCircle2,
  Shield,
  Globe,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bharat ID — Ek Desh, Ek Pehchaan" },
      {
        name: "description",
        content:
          "India's unified government identity platform. One secure vault for Aadhaar, PAN, Voter ID, Passport and more — consent-first, AI-powered, built for every Indian.",
      },
      { property: "og:title", content: "Bharat ID — One Nation, One Identity" },
      {
        property: "og:description",
        content:
          "Simplifying India's government IDs for 1.4 billion citizens. Secure, accessible, and built for Bharat.",
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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">भ</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base font-semibold tracking-tight text-foreground">Bharat ID</span>
              <span className="text-xs text-muted-foreground">Ek Desh, Ek Pehchaan</span>
            </div>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-foreground/70 md:flex">
            <a href="#gaps" className="transition hover:text-primary">The Problem</a>
            <a href="#solution" className="transition hover:text-primary">Our Solution</a>
            <a href="#pillars" className="transition hover:text-primary">Principles</a>
            <a href="#pitch" className="transition hover:text-primary">Our Mission</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="#solution"
              className="text-sm font-medium text-foreground/60 transition hover:text-primary"
            >
              How it works
            </a>
            <Link
              to="/login"
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative border-b border-border bg-gradient-to-b from-blue-50 via-background to-background pt-24">
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7 lg:pr-8">
            <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Shield className="h-3.5 w-3.5" /> Official Government Identity Platform
            </div>
            <h1 className="mt-8 font-display text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-[3.75rem]">
              One Identity. <span className="text-primary">Every Document.</span> <span className="text-primary/80">Zero Friction.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
              Bharat ID unifies Aadhaar, PAN, Voter ID, Passport and more into a single, secure, consent-first vault. Built for 1.4 billion citizens. Designed for every Indian, from Kashmir to Kanyakumari.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#gaps"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Understand the Problem <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-medium text-foreground transition hover:bg-accent"
              >
                Get Started
              </Link>
            </div>
            
            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-border pt-8">
              <div>
                <div className="font-display text-2xl font-bold text-primary">1.4B</div>
                <div className="text-xs text-foreground/60 mt-1">Citizens Served</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-primary">12+</div>
                <div className="text-xs text-foreground/60 mt-1">Core Identity Types</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-primary">1</div>
                <div className="text-xs text-foreground/60 mt-1">Unified Vault</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-border bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <span className="text-sm font-semibold text-foreground">Official Government Platform</span>
              </div>
              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">Aadhaar Integrated</div>
                    <div className="text-xs text-foreground/60 mt-1">Seamless DigiLocker integration</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">Consent-First</div>
                    <div className="text-xs text-foreground/60 mt-1">Every share is explicit & auditable</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">End-to-End Secure</div>
                    <div className="text-xs text-foreground/60 mt-1">Military-grade encryption</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">Multilingual Support</div>
                    <div className="text-xs text-foreground/60 mt-1">Voice, vernacular & accessible</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GAPS */}
      <section id="gaps" className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary/70">The Problem</div>
            <h2 className="mt-3 font-display text-4xl font-bold text-foreground sm:text-5xl">
              Eight gaps every Indian citizen faces
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-foreground/60">
              India's fragmented identity system wastes crores of hours and denies millions access to services they deserve. Bharat ID addresses every challenge.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {gaps.map((g) => (
              <article
                key={g.tag}
                className="group rounded-xl border border-border bg-white p-6 transition hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition">
                    <g.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-primary/70">{g.tag}</span>
                </div>
                <h3 className="font-display text-base font-bold leading-snug text-foreground">{g.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">{g.body}</p>
                <div className="mt-4 border-t border-border pt-3 text-xs">
                  <span className="font-semibold text-primary">Solution · </span>
                  <span className="text-foreground/70">{g.solution}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section id="solution" className="border-b border-border bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-blue-200">Our Solution</div>
            <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
              The Bridge Every Indian Deserves
            </h2>
            <p className="mt-6 text-slate-300 leading-relaxed">
              A single, secure, consent-driven vault that knows every ID you own, keeps them in sync, and lets you share verified facts — not photocopies — with any service that asks.
            </p>
            <a
              href="#pillars"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Our Core Principles <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="lg:col-span-7">
            <ol className="relative space-y-8 border-l-2 border-blue-400/30 pl-8">
              {[
                { t: "Secure Onboarding", d: "Sign in with Aadhaar OTP or DigiLocker. Bharat ID securely fetches all verified IDs you already own." },
                { t: "AI-Powered Reconciliation", d: "We detect mismatches across your documents and propose corrections using our AI consistency engine." },
                { t: "Explicit Consent Sharing", d: "Any portal, bank or employer requests verified facts via QR — you approve, scoped and time-bound." },
                { t: "Synchronized Updates", d: "Change your address once. Bharat ID fans the update out to every linked agency and tracks status live." },
              ].map((s, i) => (
                <li key={s.t} className="relative">
                  <span className="absolute -left-[50px] flex h-10 w-10 items-center justify-center rounded-full bg-blue-400 font-display font-bold text-slate-950">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-xl font-semibold">{s.t}</h3>
                  <p className="mt-2 text-slate-300 leading-relaxed">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section id="pillars" className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary/70">Core Principles</div>
            <h2 className="mt-3 font-display text-4xl font-bold text-foreground sm:text-5xl">
              Four commitments to every Indian citizen
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-xl border border-border bg-white p-7 transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-foreground">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION / CTA */}
      <section id="pitch" className="relative border-b border-border bg-gradient-to-b from-slate-900 to-slate-950 text-slate-50">
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue-200">
            <Globe className="h-3.5 w-3.5" /> National Mission
          </div>
          <h2 className="mt-8 font-display text-4xl font-bold leading-tight sm:text-5xl">
            India built world-class IDs. <span className="text-blue-300">Bharat ID makes them feel like one.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-300">
            Serving 1.4 billion citizens · AI-powered · Privacy-first · Multilingual · Accessible · Built for the next billion.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#top"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-400/30 px-7 py-3 font-medium transition hover:bg-slate-400/10"
            >
              Back to Top
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="font-display text-sm font-bold text-primary-foreground">भ</span>
                </div>
                <span className="font-display font-semibold text-slate-100">Bharat ID</span>
              </div>
              <p className="text-sm text-slate-400">Ek Desh, Ek Pehchaan — India's unified government identity platform.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-100 text-sm mb-4">About</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#gaps" className="hover:text-slate-200 transition">The Problem</a></li>
                <li><a href="#solution" className="hover:text-slate-200 transition">Our Solution</a></li>
                <li><a href="#pillars" className="hover:text-slate-200 transition">Our Principles</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-100 text-sm mb-4">Security</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-slate-200 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-slate-200 transition">Security Standards</a></li>
                <li><a href="#" className="hover:text-slate-200 transition">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm">
            <div>© {new Date().getFullYear()} Bharat ID · Serving Every Indian Citizen</div>
            <div className="mt-4 md:mt-0">Developed with commitment to Indian citizens</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
