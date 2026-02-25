import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const HEADLINE =
    'Track your first habit in 30 seconds. Everything else can wait.';

export function GrowthSprintDemo() {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(HEADLINE);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="max-w-2xl mx-auto bg-[var(--card)] border-[var(--border-strong)] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <span className="font-mono text-sm text-[var(--text-muted)]">
                    GROWTH SPRINT #1
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                    Day 3 of 7
                </Badge>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Hypothesis */}
                <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                        Hypothesis
                    </p>
                    <p className="font-body text-base leading-relaxed text-[var(--text)]">
                        Users drop off because onboarding asks for too much before showing value.
                        Reducing steps from 5 to 2 will increase completion.
                    </p>
                </div>

                <hr className="border-[var(--border)]" />

                {/* Experiment */}
                <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                        Your experiment
                    </p>
                    <div className="bg-[var(--surface)] p-4 rounded-md border border-[var(--border)]">
                        <p className="font-body text-sm text-[var(--text-muted)] mb-2">
                            New onboarding headline:
                        </p>
                        <p className="font-body text-lg leading-snug text-[var(--text)] mb-4">
                            "{HEADLINE}"
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCopy}
                                className="text-sm transition-colors duration-150"
                            >
                                {copied ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Success metric */}
                <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                        Success metric
                    </p>
                    <p className="font-body text-base leading-relaxed text-[var(--text)]">
                        Onboarding completion rate moves from 10% to 25% within 7 days.
                    </p>
                </div>

                <hr className="border-[var(--border)]" />

                {/* What to do next */}
                <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
                        What to do next
                    </p>
                    <div className="space-y-2 text-sm font-body">
                        <p>
                            <span className="text-[var(--success)] font-medium">If improved</span>
                            <span className="text-[var(--text-muted)]"> → Test pricing page next</span>
                        </p>
                        <p>
                            <span className="text-[var(--text)] font-medium">If no change</span>
                            <span className="text-[var(--text-muted)]"> → Try value-first demo instead</span>
                        </p>
                        <p>
                            <span className="text-red-600 font-medium">If worsened</span>
                            <span className="text-[var(--text-muted)]"> → Restore original, test headline only</span>
                        </p>
                    </div>
                </div>

                {/* Report Results */}
                <div className="pt-2">
                    <Button
                        variant="outline"
                        className="w-full"
                        disabled
                    >
                        Report Results
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}