import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  Workflow,
  GitBranch,
  Mail,
  Globe,
  Shield,
  BarChart3,
  Webhook,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Workflow,
    title: 'Visual Builder',
    description:
      'Drag-and-drop canvas powered by React Flow. Design complex automations without writing code.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Webhook,
    title: 'Webhook Triggers',
    description:
      'Instantly trigger workflows from any HTTP POST. Connect GitHub, Stripe, or custom webhooks.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: GitBranch,
    title: 'Conditional Logic',
    description:
      'If/Else branching with comparison operators. Route data dynamically through your pipeline.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Mail,
    title: 'Email Actions',
    description:
      'Send templated emails with dynamic variables from your webhook payload.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Globe,
    title: 'HTTP Requests',
    description:
      'Call any API with configurable method, body, and headers. Chain API responses downstream.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: BarChart3,
    title: 'Execution Audit',
    description:
      'Full per-node execution logs with input/output data, status, and timing for every run.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
];

const stats = [
  { value: '5', label: 'Node Types' },
  { value: 'BFS', label: 'DAG Engine' },
  { value: 'Real-time', label: 'Audit Logs' },
  { value: 'SMTP', label: 'Email Built-in' },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 text-center">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 mesh-gradient" />
        <div className="pointer-events-none absolute inset-0 dot-pattern opacity-40" />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div
          className="pointer-events-none absolute right-1/4 bottom-1/4 h-56 w-56 rounded-full bg-chart-4/10 blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        />

        <div className="relative z-10 mx-auto max-w-4xl animate-slide-up">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-3.5 w-3.5" />
            Event-Driven Workflow Automation
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Build Automations
            <br />
            <span className="text-gradient">Visually</span>
          </h1>

          {/* Sub-headline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Ottoflow lets you design, deploy, and monitor event-driven workflows
            with a drag-and-drop canvas. Connect webhooks, add conditions, send
            emails — all without writing code.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/workflows/new">
              <Button size="lg" className="gap-2 text-base px-8 glow">
                Start Building
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/workflows">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                <Workflow className="h-4 w-4" />
                View Workflows
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="relative z-10 mx-auto mt-20 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-xl px-6 py-4 text-center"
            >
              <div className="text-2xl font-bold text-gradient">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            A complete automation toolkit from trigger to action, with full
            observability at every step.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, idx) => (
            <div
              key={feat.title}
              className="group glass rounded-2xl p-6 transition-all hover:glow-sm hover:-translate-y-1 animate-slide-up"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${feat.bg}`}
              >
                <feat.icon className={`h-5 w-5 ${feat.color}`} />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-5xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            From webhook to action in three simple steps.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Design',
              desc: 'Drag nodes onto the canvas and connect them to build your workflow graph.',
              icon: Workflow,
            },
            {
              step: '02',
              title: 'Deploy',
              desc: 'Save your workflow and get a unique webhook URL. Point any service at it.',
              icon: Shield,
            },
            {
              step: '03',
              title: 'Monitor',
              desc: 'Watch executions in real-time. Inspect per-node input/output and errors.',
              icon: BarChart3,
            },
          ].map((item, idx) => (
            <div
              key={item.step}
              className="relative text-center animate-slide-up"
              style={{ animationDelay: `${idx * 0.12}s` }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                Step {item.step}
              </div>
              <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Footer ──────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="glass rounded-3xl px-8 py-16 glow">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Automate?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Create your first workflow in minutes. No credit card, no setup — just
            drag, drop, and deploy.
          </p>
          <div className="mt-8">
            <Link to="/workflows/new">
              <Button size="lg" className="gap-2 text-base px-8">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Ottoflow — Visual Workflow Automation
          </div>
          <div className="text-xs text-muted-foreground">
            Built with React Flow, Go, Postgres &amp; Redis
          </div>
        </div>
      </footer>
    </div>
  );
}
