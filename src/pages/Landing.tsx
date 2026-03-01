import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  BarChart3,
  Users,
  MessageSquare,
  Search,
  Shield,
  Zap,
  Target,
  Clock,
  BrainCircuit,
  Send,
  TrendingUp,
  Layers,
  ChevronRight,
  Instagram,
  FileSpreadsheet,
  Repeat,
  Eye,
  DollarSign,
  Activity,
  Timer,
  Flame,
  CalendarCheck,
  UserCheck,
  ServerCog,
  RefreshCw,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tiny helpers                                                       */
/* ------------------------------------------------------------------ */
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-20 md:py-28 px-4 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
      {children}
    </h2>
  );
}

function SectionSub({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 max-w-2xl text-lg text-zinc-400 leading-relaxed">
      {children}
    </p>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
}) {
  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-zinc-700 transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 mb-4">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-zinc-400 leading-relaxed">
            <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-zinc-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-zinc-500">{label}</div>
    </div>
  );
}

function FlowStep({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold border border-blue-500/30">
          {number}
        </div>
        <div className="mt-2 w-px flex-1 bg-zinc-800" />
      </div>
      <div className="pb-10">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-zinc-500" />
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ModuleBlock({
  icon: Icon,
  label,
  title,
  problem,
  mechanics,
  impact,
}: {
  icon: React.ElementType;
  label: string;
  title: string;
  problem: string;
  mechanics: string[];
  impact: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            {label}
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Problem
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">{problem}</p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            How it works
          </div>
          <ul className="space-y-1.5">
            {mechanics.map((m, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm text-zinc-300 leading-relaxed"
              >
                <span className="text-blue-500 mt-1 shrink-0">&#8226;</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            Revenue Impact
          </div>
          <p className="text-sm text-emerald-300/80 leading-relaxed">
            {impact}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav                                                                */
/* ------------------------------------------------------------------ */
function LandingNav({ onLogin }: { onLogin: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Quddify</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#modules" className="hover:text-white transition-colors">Modules</a>
          <a href="#engine" className="hover:text-white transition-colors">Engine</a>
          <a href="#analytics" className="hover:text-white transition-colors">Analytics</a>
          <a href="#flow" className="hover:text-white transition-colors">Data Flow</a>
          <a href="#who" className="hover:text-white transition-colors">Who It's For</a>
        </div>

        <button
          onClick={onLogin}
          className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 transition-colors"
        >
          Log In
        </button>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans antialiased">
      <LandingNav onLogin={() => navigate("/login")} />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-4 sm:px-6 overflow-hidden">
        {/* glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-block mb-6 rounded-full border border-zinc-700 bg-zinc-800/60 px-4 py-1.5 text-xs font-medium text-zinc-300">
            Instagram DM Automation for Revenue Teams
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
            Find leads. Send DMs.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Track every dollar.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-zinc-400 leading-relaxed">
            Quddify scrapes qualified prospects from Instagram reels, sends
            AI-personalized DMs across multiple sender accounts at human-like
            pace, and measures the entire path from first message to signed
            contract.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#modules"
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* stats strip */}
        <div className="relative mt-20 mx-auto max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-zinc-800 pt-10">
          <StatBlock value="4" label="Scraping phases" />
          <StatBlock value="3" label="AI providers" />
          <StatBlock value="14-day" label="Warmup schedule" />
          <StatBlock value="21" label="Data models" />
        </div>
      </section>

      {/* ── What It Actually Does ───────────────────────────────── */}
      <Section id="overview" className="border-t border-zinc-800/60">
        <SectionLabel>The System</SectionLabel>
        <SectionTitle>Three engines, one pipeline</SectionTitle>
        <SectionSub>
          Most DM tools do one thing. Quddify connects lead acquisition, message
          delivery, and revenue tracking into a single closed loop — so you
          know exactly which audience, message, and sender account produces
          paying clients.
        </SectionSub>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Find</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Deep scrape reels from competitor accounts. Extract every
              commenter. Pull profiles. Run AI qualification against your
              criteria. Output: a database of qualified prospects.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Send className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Message</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Load leads into campaigns. AI-personalize every opener. The
              scheduler sends DMs across warmed-up accounts with burst
              pacing, streak management, and active-hours enforcement.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Track</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Measure everything: reply rate, book rate, contract value — per
              seed account, per AI provider, per sender, per time of day.
              Combined inbound + outbound funnel in one dashboard.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Core Modules ─────────────────────────────────────────── */}
      <Section id="modules" className="border-t border-zinc-800/60">
        <SectionLabel>Core Modules</SectionLabel>
        <SectionTitle>Every moving part, explained</SectionTitle>
        <SectionSub>
          Seven modules that handle the full lifecycle — from scraping a
          competitor's audience to recording a signed contract.
        </SectionSub>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <ModuleBlock
            icon={Search}
            label="Module 1"
            title="Deep Scraping / Lead Acquisition"
            problem="Finding qualified Instagram prospects manually means scrolling through followers and checking bios for hours. You cannot scale this with people."
            mechanics={[
              "Point the scraper at seed accounts (competitors, niche creators).",
              "Phase 1: Scrape their reels via Apify.",
              "Phase 2: Extract every commenter on those reels — commenters on niche content are high-intent prospects.",
              "Phase 3: Pull full Instagram profiles (bio, followers, posts, verified).",
              "Phase 4: AI qualification — feed each bio to OpenAI with your custom prompt. Mark qualified or rejected with a reason.",
              "Multi-token Apify rotation: least-recently-used selection, auto-rotate on 403 rate limits.",
              "Checkpoint system: pause, resume, cancel, or skip phases. Jobs pick up exactly where they stopped.",
              "Recurring jobs: schedule re-scrapes on an interval to keep the lead pool fresh.",
              "Also supports CSV/XLSX import with column mapping and deduplication.",
            ]}
            impact="Turns 5 competitor account names into hundreds of qualified leads in hours instead of weeks. Source attribution (source_seeds[]) on every lead enables measuring which competitor audience converts best — data that guides where to target next."
          />

          <ModuleBlock
            icon={Send}
            label="Module 2"
            title="Outbound Engine"
            problem="Sending DMs manually caps at 5–10/day per person. Hiring VAs is expensive and inconsistent. Automating without pacing gets accounts banned within days."
            mechanics={[
              "Campaign scheduler ticks every 10–15 seconds on the server.",
              "Checks timezone-aware active hours (default 9AM–9PM).",
              "Round-robin sender selection: skips offline, resting, at-limit, warming, or non-ready accounts.",
              "Dynamic pacing: remaining window time ÷ remaining daily quota, with ±20% jitter and 30-second floor.",
              "Burst mode: group messages (1–10 per burst) with 10–20 minute inter-group breaks.",
              "Sending streak enforcement: 5 days on → 1 rest, 10 days on → 2 rest.",
              "Atomic lead locking prevents double-sends.",
              "Stale state cleanup every tick: offline senders after 60s, failed tasks after 2min, reset stuck leads.",
              "Two modes: Auto (fully scheduled) or Manual (VA pulls next lead from queue, confirms when sent).",
            ]}
            impact="Scales outbound from 5–10 DMs/day to 20–50+ across multiple senders. More conversations started per day = more booked calls. The pacing engine keeps accounts alive instead of burning them."
          />

          <ModuleBlock
            icon={BrainCircuit}
            label="Module 3"
            title="AI Personalization"
            problem="Copy-paste DM templates get low reply rates. Writing unique openers for 50+ leads daily is not feasible for one person."
            mechanics={[
              "Three AI providers: OpenAI (o4-mini), Claude (claude-sonnet-4-20250514), Gemini (gemini-2.0-flash).",
              "User writes a prompt describing desired message style and context.",
              "Preview mode: test the prompt on a single lead without saving.",
              "Batch generation: async processing of all pending leads with real-time Socket.IO progress updates.",
              "Variable substitution: {{username}}, {{firstName}}, {{name}}, {{bio}}.",
              "Every generated message can be manually edited before sending.",
              "Regenerate individual messages or clear all to start fresh.",
              "AI provider and model tracked on every lead — feeds into comparative analytics.",
            ]}
            impact="The outbound analytics module tracks reply rates for AI-generated vs. manually edited messages, and compares performance across providers. Users see which AI produces the highest reply-to-book conversion — not just the most natural-sounding message."
          />

          <ModuleBlock
            icon={Shield}
            label="Module 4"
            title="Sender Infrastructure"
            problem="Instagram sender accounts are the most fragile resource. Accounts get restricted if warmed up too fast, used too aggressively, or run without rest. Replacing them costs time and money."
            mechanics={[
              "OutboundAccount (persistent): credentials, proxy, 2FA, status, notes.",
              "SenderAccount (runtime): created when Chrome extension connects, tracks heartbeat, daily limit, online/offline.",
              "14-day warmup schedule: Days 1–8 are manual-only (no automation). Day 9: 5 msgs, Day 10: 8, 11: 12, 12: 15, 13: 20, 14: 25. Auto-completes after day 14.",
              "Warmup checklist: profile photo, bio, 3 posts, follow 10, like 20, story, comment 5.",
              "Browser token (oat_*) system: extension authenticates per-account. Revoking disconnects instantly.",
              "Full audit trail via WarmupLog.",
              "Account statuses: new → warming → ready → restricted → disabled.",
            ]}
            impact="Structured warmup and enforced rest days extend sender account lifespan. Users stop burning through accounts every 2 weeks. The browser token system lets team members manage senders without sharing Instagram passwords."
          />

          <ModuleBlock
            icon={Layers}
            label="Module 5"
            title="Campaign Management"
            problem="Running DM campaigns manually means juggling spreadsheets, tracking who was messaged, managing multiple accounts, and guessing when to send. Mistakes cost opportunities."
            mechanics={[
              "Campaign lifecycle: draft → active → paused → completed.",
              "Multiple message templates with variable substitution.",
              "Schedule config: active hours, timezone, min/max delays, burst settings.",
              "Daily limit per sender with warmup ramp integration.",
              "Lead statuses: pending → queued → sent → delivered | replied | failed | skipped.",
              "Retry failed/skipped leads in bulk. Manually override any status.",
              "Duplicate campaigns with or without leads.",
              "Next-send-time calculator: factors in delays, burst breaks, warmup caps, active hours.",
              "Extension connectivity check: API key + ping/pong.",
              "Real-time stats via Socket.IO.",
            ]}
            impact="Reduces campaign setup from hours to minutes. Zero skipped or double-messaged leads. Multiple simultaneous campaigns across different audience segments from the same interface."
          />

          <ModuleBlock
            icon={Activity}
            label="Module 6"
            title="Inbound Engine"
            problem="Coaches and consultants generate inbound leads from content, ads, and referrals through GHL. Without connecting that data, outbound and inbound operate as blind silos."
            mechanics={[
              "GHL webhook integration: push inbound leads into the same system.",
              "Lead model with full CRM fields: stages, follow-up tracking, booking status, contract value.",
              "Calendly token integration for booking confirmations.",
              "Public tracking pixel endpoint (GET /t/:accountId/:eventId) for conversion attribution.",
              "Account-level conversion rules (regex patterns) classify tracking events.",
              "Combined dashboard funnel: inbound (created → link sent → booked) alongside outbound.",
            ]}
            impact="Prevents double-messaging inbound leads via outbound campaigns. Unified pipeline visibility shows whether inbound or outbound produces more revenue per effort, so the user can reallocate resources with data."
          />

          <ModuleBlock
            icon={BarChart3}
            label="Module 7"
            title="Analytics & Reporting"
            problem="Most DM tools show 'messages sent' and nothing else. You cannot make decisions about targeting, timing, or messaging without data at every stage."
            mechanics={[
              "Dashboard: inbound/outbound/combined funnels, velocity metrics, daily volume, cumulative bookings, radar chart, stage aging.",
              "Outbound analytics: funnel dropoff, daily performance, activity heatmap, response speed, conversation depth.",
              "AI model comparison: reply rates and book rates by provider (OpenAI vs Claude vs Gemini).",
              "Edited vs. generated: do manually edited AI messages outperform raw output?",
              "Time-of-day heatmap: reply probability by hour.",
              "Effort/outcome: messages sent vs. bookings — cost per booking in effort terms.",
              "All metrics filterable by sender, campaign, and date range.",
              "Lead-level tracking: contract_value, closed_at, source_seeds[], ai_provider, ai_model.",
            ]}
            impact="Users identify which seed accounts, AI providers, message templates, sender accounts, and time windows produce paying clients — not just replies. Revenue attribution goes down to the source competitor account."
          />
        </div>
      </Section>

      {/* ── The Engine Detail ────────────────────────────────────── */}
      <Section id="engine" className="border-t border-zinc-800/60">
        <SectionLabel>Under the Hood</SectionLabel>
        <SectionTitle>How the outbound engine sends DMs</SectionTitle>
        <SectionSub>
          The campaign scheduler runs server-side, making decisions every 10–15
          seconds. Here's the exact sequence from scheduled tick to delivered DM.
        </SectionSub>

        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          {/* Left: scheduler logic */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">
              Scheduler Decision Tree
            </h3>
            <div className="space-y-4 text-sm">
              {[
                {
                  label: "Active Hours Check",
                  desc: "Is the current time within the campaign's active window? Timezone-aware. Default 9AM–9PM.",
                  color: "text-blue-400",
                },
                {
                  label: "Sender Selection",
                  desc: "Round-robin across online senders. Skip if: offline, rest day, daily limit hit, warmup blocked, account not ready.",
                  color: "text-violet-400",
                },
                {
                  label: "Lead Locking",
                  desc: "Atomically claim a pending lead (prefer leads that haven't failed with any sender). Set status to queued.",
                  color: "text-cyan-400",
                },
                {
                  label: "Delay Calculation",
                  desc: "Remaining active time ÷ remaining quota. Apply ±20% jitter. Floor at 30 seconds. Ramp up if behind schedule.",
                  color: "text-amber-400",
                },
                {
                  label: "Burst Logic",
                  desc: "If burst mode on: send N messages per group, then wait 10–20 min break. Reset counters daily.",
                  color: "text-emerald-400",
                },
                {
                  label: "Task Creation",
                  desc: "Create send_dm task. Emit to the correct Chrome extension via Socket.IO. Extension sends the DM through the logged-in IG session.",
                  color: "text-rose-400",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                >
                  <div
                    className={`mt-0.5 text-xs font-bold ${step.color} shrink-0 w-5`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{step.label}</div>
                    <div className="text-zinc-400 mt-0.5">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: safety systems */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">
              Safety & Anti-Detection
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Timer,
                  title: "Dynamic Pacing",
                  desc: "Delay between messages adapts to remaining quota and window time. Never fixed intervals.",
                },
                {
                  icon: Flame,
                  title: "14-Day Warmup",
                  desc: "Days 1–8: manual only. Day 9–14: gradual ramp from 5 to 25 msgs/day. Auto-completes.",
                },
                {
                  icon: RefreshCw,
                  title: "Streak Rest Days",
                  desc: "5 days sending → 1 day rest. 10 days → 2 days rest. Prevents long-running patterns.",
                },
                {
                  icon: Zap,
                  title: "Burst Mode",
                  desc: "Group rapid sends with long breaks between groups. Mimics natural usage bursts.",
                },
                {
                  icon: Clock,
                  title: "Stale Cleanup",
                  desc: "Every tick: reset offline senders (60s), fail stuck tasks (2min), unlock stuck leads (5min).",
                },
                {
                  icon: Shield,
                  title: "Jitter",
                  desc: "±20% randomization on all delays. No two messages sent at predictable intervals.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                >
                  <item.icon className="h-4 w-4 text-zinc-500 mb-2" />
                  <div className="text-sm font-semibold text-white mb-1">
                    {item.title}
                  </div>
                  <div className="text-xs text-zinc-400 leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Analytics Deep Dive ──────────────────────────────────── */}
      <Section id="analytics" className="border-t border-zinc-800/60">
        <SectionLabel>Analytics Layer</SectionLabel>
        <SectionTitle>Measure at every stage</SectionTitle>
        <SectionSub>
          Two analytics surfaces — a combined dashboard for pipeline visibility,
          and a dedicated outbound analytics suite for DM performance.
        </SectionSub>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Dashboard analytics */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
            <h3 className="text-lg font-semibold text-white mb-1">
              Pipeline Dashboard
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              Combined inbound + outbound view
            </p>
            <div className="space-y-3">
              {[
                {
                  metric: "Funnel Visualization",
                  detail:
                    "Three modes: inbound (created → link sent → booked), outbound (messaged → replied → booked), combined.",
                },
                {
                  metric: "Velocity Metrics",
                  detail:
                    "Time from lead creation to link sent. Time from link sent to booked. Measures speed, not just volume.",
                },
                {
                  metric: "Daily Volume",
                  detail: "Lead creation and booking counts per day.",
                },
                {
                  metric: "Cumulative Bookings",
                  detail: "Running total over time — shows acceleration or deceleration.",
                },
                {
                  metric: "Stage Aging",
                  detail:
                    "How long inbound leads sit in each stage. Identifies where the pipeline stalls.",
                },
                {
                  metric: "Ghosting Analysis",
                  detail:
                    "Leads that stopped responding, bucketed by days since last interaction.",
                },
                {
                  metric: "Follow-Up Effectiveness",
                  detail:
                    "Whether follow-up messages produce bookings or just noise.",
                },
                {
                  metric: "Radar Chart",
                  detail:
                    "Multi-axis view of lead distribution across all stages simultaneously.",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex gap-3 text-sm border-b border-zinc-800/60 pb-3 last:border-0 last:pb-0"
                >
                  <span className="font-medium text-white whitespace-nowrap shrink-0 w-44">
                    {row.metric}
                  </span>
                  <span className="text-zinc-400">{row.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Outbound analytics */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
            <h3 className="text-lg font-semibold text-white mb-1">
              Outbound Analytics
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              DM performance deep dive
            </p>
            <div className="space-y-3">
              {[
                {
                  metric: "Funnel Dropoff",
                  detail:
                    "Exact % lost at each stage: sent → delivered → replied → link sent → booked.",
                },
                {
                  metric: "Activity Heatmap",
                  detail:
                    "Hour-of-day grid showing when sends happen and when replies come in.",
                },
                {
                  metric: "Response Speed",
                  detail: "Distribution of how quickly prospects reply after receiving a DM.",
                },
                {
                  metric: "Conversation Depth",
                  detail:
                    "Number of back-and-forth messages before a booking. Identifies ideal conversation length.",
                },
                {
                  metric: "AI Model Comparison",
                  detail:
                    "Reply rate and book rate by AI provider. Side-by-side: OpenAI vs Claude vs Gemini.",
                },
                {
                  metric: "Edited vs. Generated",
                  detail:
                    "Do manually tweaked AI messages outperform raw AI output? Measured by reply and book rate.",
                },
                {
                  metric: "Time-of-Day Heatmap",
                  detail:
                    "Reply probability by hour — helps set optimal active hours window.",
                },
                {
                  metric: "Effort / Outcome",
                  detail:
                    "Messages sent vs. bookings achieved. True cost-per-booking in effort terms.",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex gap-3 text-sm border-b border-zinc-800/60 pb-3 last:border-0 last:pb-0"
                >
                  <span className="font-medium text-white whitespace-nowrap shrink-0 w-44">
                    {row.metric}
                  </span>
                  <span className="text-zinc-400">{row.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lead-level data points */}
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <h3 className="text-lg font-semibold text-white mb-1">
            Per-Lead Data Points
          </h3>
          <p className="text-sm text-zinc-500 mb-6">
            Every lead carries full attribution data from scrape to close
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Instagram, label: "isMessaged, dmDate", desc: "Whether and when they were DMed" },
              { icon: MessageSquare, label: "replied", desc: "Whether they responded" },
              { icon: CalendarCheck, label: "booked", desc: "Whether they booked a call" },
              { icon: DollarSign, label: "contract_value, closed_at", desc: "Revenue and close date" },
              { icon: Target, label: "source_seeds[]", desc: "Which scrape sources produced them" },
              { icon: BrainCircuit, label: "ai_provider, ai_model", desc: "Which AI wrote their message" },
              { icon: UserCheck, label: "qualified, reason", desc: "AI classification result" },
              { icon: Eye, label: "tracking events", desc: "Link clicks and conversion events" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <item.icon className="h-4 w-4 mt-0.5 text-zinc-600 shrink-0" />
                <div>
                  <div className="text-xs font-mono text-blue-400">{item.label}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Data Flow ────────────────────────────────────────────── */}
      <Section id="flow" className="border-t border-zinc-800/60">
        <SectionLabel>Data Architecture</SectionLabel>
        <SectionTitle>How data flows through the system</SectionTitle>
        <SectionSub>
          Two parallel pipelines — outbound and inbound — converging into one
          dashboard with unified revenue tracking.
        </SectionSub>

        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          {/* Outbound flow */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-8 flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-400" /> Outbound Flow
            </h3>
            <FlowStep
              number="1"
              icon={Users}
              title="Seed Accounts"
              description="Enter competitor/niche Instagram handles as scraping targets."
            />
            <FlowStep
              number="2"
              icon={Search}
              title="Deep Scrape"
              description="Reels extracted → commenters extracted → full profiles pulled via Apify (multi-token rotation)."
            />
            <FlowStep
              number="3"
              icon={BrainCircuit}
              title="AI Qualification"
              description="Each bio sent to OpenAI against your custom prompt. Qualified or rejected with reason."
            />
            <FlowStep
              number="4"
              icon={FileSpreadsheet}
              title="OutboundLead Created"
              description="Qualified prospect stored with source_seeds[], follower count, bio, verified status."
            />
            <FlowStep
              number="5"
              icon={Layers}
              title="Campaign Assignment"
              description="Leads added to a campaign. AI personalization generates unique openers."
            />
            <FlowStep
              number="6"
              icon={ServerCog}
              title="Scheduler Sends"
              description="Task created, emitted to Chrome extension via Socket.IO. Extension sends the DM."
            />
            <FlowStep
              number="7"
              icon={MessageSquare}
              title="Reply & Booking"
              description="Reply detected → conversation → link sent → booking confirmed via Calendly/GHL."
            />
            <div className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/30">
                  8
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-zinc-500" />
                  <h4 className="font-semibold text-white">Contract Closed</h4>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  contract_value and closed_at recorded. Analytics now trace revenue back to the seed account.
                </p>
              </div>
            </div>
          </div>

          {/* Inbound flow */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-8 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" /> Inbound Flow
            </h3>
            <FlowStep
              number="1"
              icon={Eye}
              title="Prospect Discovers Content"
              description="Through ads, organic posts, referrals, or lead magnets."
            />
            <FlowStep
              number="2"
              icon={CalendarCheck}
              title="Books via GHL"
              description="Prospect fills out a form or books a call. GHL webhook fires."
            />
            <FlowStep
              number="3"
              icon={Users}
              title="Lead Created in System"
              description="Inbound lead record with full CRM fields, stage tracking, follow-up status."
            />
            <FlowStep
              number="4"
              icon={TrendingUp}
              title="Tracked Through Stages"
              description="new → contacted → link sent → follow-up → booked. Stage aging measured at each step."
            />
            <FlowStep
              number="5"
              icon={DollarSign}
              title="Contract Value Recorded"
              description="Revenue tracked on the lead record. Feeds into unified dashboard."
            />
            <div className="relative flex gap-4 mt-8">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                  <Repeat className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white">
                    Both Pipelines Converge
                  </h4>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  The dashboard shows inbound and outbound funnels side by side
                  or combined — same velocity metrics, same revenue tracking,
                  one view.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time layer */}
        <div className="mt-14 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Real-Time Layer (Socket.IO)
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { event: "sender:online / offline", desc: "Extension heartbeat every 15s. Dashboard shows live sender status." },
              { event: "task:new", desc: "Scheduler emits DM task to specific Chrome extension instance." },
              { event: "campaign:generation:progress", desc: "AI personalization batch progress streamed to UI." },
              { event: "deep-scrape:progress", desc: "Scrape job stats updated live: reels, comments, profiles, qualified." },
              { event: "job:completed / failed", desc: "Import job status changes push to dashboard instantly." },
              { event: "outbound-account:updated", desc: "Account status changes (restricted, disabled) broadcast in real-time." },
            ].map((item, i) => (
              <div key={i} className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-4">
                <div className="text-xs font-mono text-cyan-400 mb-1">{item.event}</div>
                <div className="text-xs text-zinc-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Differentiators ──────────────────────────────────────── */}
      <Section className="border-t border-zinc-800/60">
        <SectionLabel>Positioning</SectionLabel>
        <SectionTitle>What makes this different</SectionTitle>
        <SectionSub>
          Compared to basic DM tools that assume you already have a list and only
          count "messages sent."
        </SectionSub>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Search}
            title="Lead acquisition is built in"
            items={[
              "Most DM tools assume you already have a list.",
              "Quddify scrapes reels → extracts commenters → qualifies with AI → feeds directly into campaigns.",
              "The list-building is part of the product.",
            ]}
          />
          <FeatureCard
            icon={BrainCircuit}
            title="3 AI providers with comparative data"
            items={[
              "Not just a toggle — the system tracks which provider produces better reply rates.",
              "Side-by-side: OpenAI vs Claude vs Gemini.",
              "Also measures human-edited vs raw AI output.",
            ]}
          />
          <FeatureCard
            icon={Shield}
            title="Warmup is enforced, not optional"
            items={[
              "14-day schedule built into the scheduler.",
              "You cannot accidentally skip warmup.",
              "Sending streak rest days are mandatory.",
              "The system blocks sends from accounts that aren't ready.",
            ]}
          />
          <FeatureCard
            icon={Repeat}
            title="Inbound + outbound in one funnel"
            items={[
              "Dashboard shows combined pipeline from GHL inbound + Instagram outbound.",
              "Most DM tools have zero awareness of your inbound pipeline.",
              "Prevents double-messaging. Shows true total volume.",
            ]}
          />
          <FeatureCard
            icon={Target}
            title="Revenue attribution to source"
            items={[
              "source_seeds[] tracked on every lead.",
              "contract_value tracked on closed deals.",
              "Calculate actual revenue per competitor account scraped.",
              "Answers 'which audience should I target?' with data.",
            ]}
          />
          <FeatureCard
            icon={Users}
            title="Manual + auto in the same system"
            items={[
              "Same campaign can run automated or VA-driven.",
              "Same tracking, same lead queue, same analytics.",
              "Handle high-value leads manually. Automate the rest.",
              "Multi-tenant with role-based team access.",
            ]}
          />
        </div>
      </Section>

      {/* ── Who It's For ─────────────────────────────────────────── */}
      <Section id="who" className="border-t border-zinc-800/60">
        <SectionLabel>Who It's For</SectionLabel>
        <SectionTitle>Built for revenue teams on Instagram</SectionTitle>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {[
            {
              title: "Coaches",
              description:
                "You sell coaching programs through DM conversations. You scrape the audience of other coaches in your niche. AI qualifies prospects by bio. Personalized openers reference their work. The system tracks every conversation from first DM to signed contract. You see which competitor's audience produces the most clients.",
              metrics: [
                "Leads scraped per week",
                "Reply rate by AI provider",
                "Booked calls per campaign",
                "Revenue per seed account",
              ],
            },
            {
              title: "Consultants",
              description:
                "You close high-ticket consulting via discovery calls. Deep scraping targets commenters on industry reels — people actively engaging with your topic. The warmup system keeps your sender accounts alive for months. Analytics show time-of-day reply patterns so you send when prospects actually read DMs.",
              metrics: [
                "Contract value per lead",
                "Time from DM to booking",
                "Sender account health",
                "Optimal send windows",
              ],
            },
            {
              title: "Agencies",
              description:
                "You manage outbound for multiple clients. Multi-tenant architecture isolates each client's data, sender accounts, and campaigns. Team members get role-based access. Admin dashboard shows performance across all clients. Data migration lets you move configurations between accounts.",
              metrics: [
                "Per-client campaign performance",
                "Team member productivity",
                "Cross-client benchmarks",
                "Total pipeline volume",
              ],
            },
          ].map((persona, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8"
            >
              <h3 className="text-xl font-bold text-white mb-3">
                {persona.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                {persona.description}
              </p>
              <div className="border-t border-zinc-800 pt-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Key Metrics They Track
                </div>
                <ul className="space-y-1.5">
                  {persona.metrics.map((m, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-sm text-zinc-300"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── What This Is Not ─────────────────────────────────────── */}
      <Section className="border-t border-zinc-800/60">
        <SectionLabel>Clarity</SectionLabel>
        <SectionTitle>What this app is not</SectionTitle>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Not a CRM",
              desc: "Integrates with GHL for CRM functions. Tracks lead stages and contract values, but does not manage deals, invoices, or full client communication.",
            },
            {
              title: "Not a social media scheduler",
              desc: "Does not post content, schedule stories, or manage Instagram feeds.",
            },
            {
              title: "Not a chatbot",
              desc: "Sends opening messages and tracks replies. Does not automate conversation flows or respond to incoming DMs.",
            },
            {
              title: "Not a scraper-only tool",
              desc: "Scraping exists to feed campaigns. Not designed for bulk data extraction without messaging intent.",
            },
            {
              title: "Not an Instagram API integration",
              desc: "All DM sending happens through a Chrome extension on logged-in sessions. No official Instagram API for messaging.",
            },
            {
              title: "Not an email tool",
              desc: "Instagram-only for message delivery. No email, LinkedIn, or other channel support.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <h4 className="text-sm font-semibold text-white mb-1">
                {item.title}
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── The Real Outcome ─────────────────────────────────────── */}
      <Section className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>The Real Outcome</SectionLabel>
          <SectionTitle>
            A measurable, repeatable client acquisition machine
          </SectionTitle>
          <div className="mt-8 text-base text-zinc-400 leading-relaxed space-y-4">
            <p>
              Point the scraper at competitor accounts. Qualified leads
              appear. Load them into a campaign. AI writes unique openers.
              The scheduler sends across warmed-up accounts at human pace.
            </p>
            <p>
              Prospects reply. Conversations happen. Calls get booked.
              Contracts close. Revenue is tracked back to the exact seed
              account, AI provider, sender, and time of day that produced it.
            </p>
            <p className="text-white font-medium">
              Scrape &rarr; Qualify &rarr; Personalize &rarr; Send &rarr; Track &rarr; Close &rarr; Measure &rarr; Repeat.
            </p>
          </div>

          <div className="mt-12">
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-4 text-base font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </Section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/60 py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-blue-500 flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Quddify</span>
          </div>
          <div className="text-xs text-zinc-600">
            Instagram DM Automation for Revenue Teams
          </div>
        </div>
      </footer>
    </div>
  );
}
