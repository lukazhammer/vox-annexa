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
        <div className="min-h-screen bg-[#faf7f2]">

            {/* ── Navigation ──────────────────────────────────────── */}
            <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
                <a href="/" className="text-2xl text-[#1a1a1a]" style={{ fontFamily: "'Caudex', serif" }}>
                    Annexa<span className="text-[#A03814]">.</span>
                </a>
                <div className="flex items-center gap-6">
                    <a
                        href="#demo"
                        className="text-sm text-[rgba(26,26,26,0.7)] hover:text-[#1a1a1a] transition-colors duration-150"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                        See it work
                    </a>
                    <a
                        href="#pricing"
                        className="text-sm text-[rgba(26,26,26,0.7)] hover:text-[#1a1a1a] transition-colors duration-150"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                        Pricing
                    </a>
                </div>
            </nav>

            {/* ── Hero ────────────────────────────────────────────── */}
            <section className="px-6 py-24 md:py-32 max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl text-[#1a1a1a] leading-tight mb-6" style={{ fontFamily: "'Caudex', serif" }}>
                    You shipped it.<br />
                    Now find out what's working.
                </h1>
                <p className="text-lg text-[rgba(26,26,26,0.7)] mb-8 max-w-xl mx-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Growth Sprints for indie builders. One experiment per week.
                    No dashboards. No analytics degree. Just answers.
                </p>
                <Button
                    onClick={scrollToDemo}
                    className="bg-[#A03814] hover:bg-[#8a2f11] text-white px-8 py-3 text-base"
                >
                    See a Growth Sprint
                </Button>
                <p className="text-sm text-[rgba(26,26,26,0.7)] mt-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Free to try. No account required.
                </p>
            </section>

            {/* ── Problem ─────────────────────────────────────────── */}
            <section className="px-6 py-16 bg-[#f5f0ea]">
                <div className="max-w-2xl mx-auto text-center">
                    <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.7)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        The problem
                    </p>
                    <h2 className="text-3xl text-[#1a1a1a] mb-6" style={{ fontFamily: "'Caudex', serif" }}>
                        You're moving fast. Your analytics aren't.
                    </h2>
                    <div className="text-[rgba(26,26,26,0.7)] space-y-4 text-left max-w-xl mx-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
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
            <section id="demo" className="px-6 py-16 bg-[#faf7f2]">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.7)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            See it work
                        </p>
                        <h2 className="text-3xl text-[#1a1a1a] mb-4" style={{ fontFamily: "'Caudex', serif" }}>
                            A Growth Sprint in action
                        </h2>
                        <p className="text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            This is a real sprint for a habit tracking app struggling with activation.
                        </p>
                    </div>

                    <GrowthSprintDemo />

                    <div className="text-center mt-8">
                        <p className="text-sm text-[rgba(26,26,26,0.7)] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            This sprint was generated in 8 seconds. No setup. No integrations.
                        </p>
                        <Button
                            onClick={scrollToSelector}
                            variant="outline"
                            className="border-[#A03814] text-[#A03814] hover:bg-[#A03814] hover:text-white"
                        >
                            Run one for your product
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── How It Works ────────────────────────────────────── */}
            <section className="px-6 py-16 bg-[#f5f0ea]">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.7)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            How it works
                        </p>
                        <h2 className="text-3xl text-[#1a1a1a]" style={{ fontFamily: "'Caudex', serif" }}>
                            One sprint. One week. One answer.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <p className="text-4xl text-[rgba(26,26,26,0.5)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>01</p>
                            <h3 className="font-semibold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                Pick your bottleneck
                            </h3>
                            <p className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                Can't get users? Can't activate them? Can't keep them? Can't get referrals? Pick one.
                            </p>
                        </div>
                        <div>
                            <p className="text-4xl text-[rgba(26,26,26,0.5)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>02</p>
                            <h3 className="font-semibold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                Run the experiment
                            </h3>
                            <p className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                Copy the variant. Paste it into your site. Implementation prompt ready for Bolt, Base44, or Lovable. Wait 7 days.
                            </p>
                        </div>
                        <div>
                            <p className="text-4xl text-[rgba(26,26,26,0.5)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>03</p>
                            <h3 className="font-semibold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                Learn what's next
                            </h3>
                            <p className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                Report what happened. AI interprets results and prescribes the next experiment. No guessing.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Bottleneck Selector ─────────────────────────────── */}
            <section id="selector" className="px-6 py-16 bg-[#faf7f2]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl text-[#1a1a1a] mb-4" style={{ fontFamily: "'Caudex', serif" }}>
                        What's stuck?
                    </h2>
                    <p className="text-[rgba(26,26,26,0.7)] mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Pick one. We'll build your first sprint.
                    </p>
                    <BottleneckSelector />
                </div>
            </section>

            {/* ── Pricing ─────────────────────────────────────────── */}
            <section id="pricing" className="px-6 py-16 bg-[#f5f0ea]">
                <div className="max-w-5xl mx-auto text-center">
                    <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.7)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Pricing
                    </p>
                    <h2 className="text-3xl text-[#1a1a1a] mb-4" style={{ fontFamily: "'Caudex', serif" }}>
                        No subscription. No dashboard.
                    </h2>
                    <p className="text-[rgba(26,26,26,0.7)] mb-12" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Pay once. Run your sprints. Move on.
                    </p>
                    <PricingTiers />
                </div>
            </section>

            {/* ── Legal Docs Mention ──────────────────────────────── */}
            <section className="px-6 py-12 bg-[#faf7f2]">
                <div className="max-w-2xl mx-auto text-center">
                    <h3 className="text-xl text-[#1a1a1a] mb-3" style={{ fontFamily: "'Caudex', serif" }}>
                        Oh, and you get legal docs too.
                    </h3>
                    <p className="text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Privacy policy. Terms of service. Cookie policy. GDPR-ready.
                        All tiers. Because you shouldn't have to think about that either.
                    </p>
                </div>
            </section>

            {/* ── Final CTA ───────────────────────────────────────── */}
            <section className="px-6 py-24 bg-[#f5f0ea]">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl text-[#1a1a1a] mb-4" style={{ fontFamily: "'Caudex', serif" }}>
                        Ready to grow?
                    </h2>
                    <p className="text-[rgba(26,26,26,0.7)] mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Pick your bottleneck and get your first sprint in under a minute.
                    </p>
                    <Button
                        onClick={scrollToSelector}
                        className="bg-[#A03814] hover:bg-[#8a2f11] text-white px-8 py-3 text-base"
                    >
                        Start my first sprint
                    </Button>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────── */}
            <footer className="px-6 py-8 border-t border-[rgba(26,26,26,0.12)] bg-[#faf7f2]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <p>
                        © 2026{' '}
                        <a
                            href="https://vox-animus.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#A03814] hover:underline"
                        >
                            Vox Animus OÜ
                        </a>
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="/annexaprivacy" className="hover:text-[#1a1a1a]">
                            Privacy
                        </a>
                        <a href="/annexaterms" className="hover:text-[#1a1a1a]">
                            Terms
                        </a>
                        <a href="/annexacookies" className="hover:text-[#1a1a1a]">
                            Cookies
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}