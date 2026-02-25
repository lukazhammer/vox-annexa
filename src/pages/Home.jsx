import { Button } from '@/components/ui/button';
import { GrowthSprintDemo } from '@/components/landing/GrowthSprintDemo';
import { BottleneckSelector } from '@/components/landing/BottleneckSelector';
import { PricingTiers } from '@/components/landing/PricingTiers';

export default function Home() {
    const scrollToDemo = () => {
        document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToSelector = () => {
        document.getElementById('selector')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">

            {/* ── Navigation ──────────────────────────────────────── */}
            <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
                <a href="/" className="font-headline text-2xl text-[var(--text)]">
                    Annexa<span className="text-[var(--accent)]">.</span>
                </a>
                <div className="flex items-center gap-6">
                    <a
                        href="#demo"
                        className="font-body text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150"
                    >
                        See it work
                    </a>
                    <a
                        href="#pricing"
                        className="font-body text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150"
                    >
                        Pricing
                    </a>
                </div>
            </nav>

            {/* ── Hero ────────────────────────────────────────────── */}
            <section className="px-6 py-24 md:py-32 max-w-3xl mx-auto text-center">
                <h1 className="font-headline text-4xl md:text-5xl text-[var(--text)] leading-tight mb-6">
                    You shipped it.<br />
                    Now find out what's working.
                </h1>
                <p className="font-body text-lg text-[var(--text-muted)] mb-8 max-w-xl mx-auto">
                    Growth Sprints for indie builders. One experiment per week.
                    No dashboards. No analytics degree. Just answers.
                </p>
                <Button
                    onClick={scrollToDemo}
                    className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white px-8 py-3 text-base"
                >
                    See a Growth Sprint
                </Button>
                <p className="font-body text-sm text-[var(--text-muted)] mt-4">
                    Free to try. No account required.
                </p>
            </section>

            {/* ── Problem ─────────────────────────────────────────── */}
            <section className="px-6 py-16 bg-[var(--surface)]">
                <div className="max-w-2xl mx-auto text-center">
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
                        The problem
                    </p>
                    <h2 className="font-headline text-3xl text-[var(--text)] mb-6">
                        You're moving fast. Your analytics aren't.
                    </h2>
                    <div className="font-body text-[var(--text-muted)] space-y-4 text-left max-w-xl mx-auto">
                        <p>
                            You shipped a landing page. Changed the headline. Added a testimonial.
                            Adjusted the pricing. Now you're staring at Google Analytics wondering
                            if any of it mattered.
                        </p>
                        <p>
                            Dashboards show you numbers. They don't tell you what to do next.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Live Example ────────────────────────────────────── */}
            <section id="demo" className="px-6 py-16">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
                            See it work
                        </p>
                        <h2 className="font-headline text-3xl text-[var(--text)] mb-4">
                            A Growth Sprint in action
                        </h2>
                        <p className="font-body text-[var(--text-muted)]">
                            This is a real sprint for a habit tracking app struggling with activation.
                        </p>
                    </div>

                    <GrowthSprintDemo />

                    <div className="text-center mt-8">
                        <p className="font-body text-sm text-[var(--text-muted)] mb-4">
                            This sprint was generated in 8 seconds. No setup. No integrations.
                        </p>
                        <Button
                            onClick={scrollToSelector}
                            variant="outline"
                            className="border-[var(--accent)] text-[var(--accent)]"
                        >
                            Run one for your product
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── How It Works ────────────────────────────────────── */}
            <section className="px-6 py-16 bg-[var(--surface)]">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
                            How it works
                        </p>
                        <h2 className="font-headline text-3xl text-[var(--text)]">
                            One sprint. One week. One answer.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <p className="font-mono text-4xl text-[var(--text-muted)] mb-4">01</p>
                            <h3 className="font-body font-semibold text-[var(--text)] mb-2">
                                Pick your bottleneck
                            </h3>
                            <p className="font-body text-sm text-[var(--text-muted)]">
                                Can't get users? Can't activate them? Can't keep them? Can't get referrals? Pick one.
                            </p>
                        </div>
                        <div>
                            <p className="font-mono text-4xl text-[var(--text-muted)] mb-4">02</p>
                            <h3 className="font-body font-semibold text-[var(--text)] mb-2">
                                Run the experiment
                            </h3>
                            <p className="font-body text-sm text-[var(--text-muted)]">
                                Copy the variant. Paste it into your site. Implementation prompt ready for Bolt, Cursor, or Lovable. Wait 7 days.
                            </p>
                        </div>
                        <div>
                            <p className="font-mono text-4xl text-[var(--text-muted)] mb-4">03</p>
                            <h3 className="font-body font-semibold text-[var(--text)] mb-2">
                                Learn what's next
                            </h3>
                            <p className="font-body text-sm text-[var(--text-muted)]">
                                Report what happened. AI interprets results and prescribes the next experiment. No guessing.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Bottleneck Selector ─────────────────────────────── */}
            <section id="selector" className="px-6 py-16">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-headline text-3xl text-[var(--text)] mb-4">
                        What's stuck?
                    </h2>
                    <p className="font-body text-[var(--text-muted)] mb-8">
                        Pick one. We'll build your first sprint.
                    </p>
                    <BottleneckSelector />
                </div>
            </section>

            {/* ── Pricing ─────────────────────────────────────────── */}
            <section id="pricing" className="px-6 py-16 bg-[var(--surface)]">
                <div className="max-w-5xl mx-auto text-center">
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
                        Pricing
                    </p>
                    <h2 className="font-headline text-3xl text-[var(--text)] mb-4">
                        No subscription. No dashboard.
                    </h2>
                    <p className="font-body text-[var(--text-muted)] mb-12">
                        Pay once. Run your sprints. Move on.
                    </p>
                    <PricingTiers />
                </div>
            </section>

            {/* ── Legal Docs Mention ──────────────────────────────── */}
            <section className="px-6 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <h3 className="font-headline text-xl text-[var(--text)] mb-3">
                        Oh, and you get legal docs too.
                    </h3>
                    <p className="font-body text-[var(--text-muted)]">
                        Privacy policy. Terms of service. Cookie policy. GDPR-ready.
                        All tiers. Because you shouldn't have to think about that either.
                    </p>
                </div>
            </section>

            {/* ── Final CTA ───────────────────────────────────────── */}
            <section className="px-6 py-24 bg-[var(--surface)]">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="font-headline text-3xl text-[var(--text)] mb-4">
                        Ready to grow?
                    </h2>
                    <p className="font-body text-[var(--text-muted)] mb-8">
                        Pick your bottleneck and get your first sprint in under a minute.
                    </p>
                    <Button
                        onClick={scrollToSelector}
                        className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white px-8 py-3 text-base"
                    >
                        Start my first sprint
                    </Button>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────── */}
            <footer className="px-6 py-8 border-t border-[var(--border)]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-body text-[var(--text-muted)]">
                    <p>
                        © 2026{' '}
                        <a
                            href="https://vox-animus.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent)] hover:underline"
                        >
                            Vox Animus OÜ
                        </a>
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="/annexaprivacy" className="hover:text-[var(--text)]">
                            Privacy
                        </a>
                        <a href="/annexaterms" className="hover:text-[var(--text)]">
                            Terms
                        </a>
                        <a href="/annexacookies" className="hover:text-[var(--text)]">
                            Cookies
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}