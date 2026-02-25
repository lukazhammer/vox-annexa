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
        <Card className="max-w-2xl mx-auto bg-white border-[rgba(26,26,26,0.2)] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <span className="font-mono text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    GROWTH SPRINT #1
                </span>
                <Badge variant="outline" className="font-mono text-xs border-[rgba(26,26,26,0.2)] text-[#1a1a1a]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Day 3 of 7
                </Badge>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Hypothesis */}
                <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[rgba(26,26,26,0.7)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Hypothesis
                    </p>
                    <p className="text-base leading-relaxed text-[#1a1a1a]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Users drop off because onboarding asks for too much before showing value.
                        Reducing steps from 5 to 2 will increase completion.
                    </p>
                </div>

                <hr className="border-[rgba(26,26,26,0.12)]" />

                {/* Experiment */}
                <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[rgba(26,26,26,0.7)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Your experiment
                    </p>
                    <div className="bg-[#f5f0ea] p-4 rounded-md border border-[rgba(26,26,26,0.12)]">
                        <p className="text-sm text-[rgba(26,26,26,0.7)] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            New onboarding headline:
                        </p>
                        <p className="text-lg leading-snug text-[#1a1a1a] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            "{HEADLINE}"
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCopy}
                                className="text-sm transition-colors duration-150 border-[rgba(26,26,26,0.2)] text-[#1a1a1a] hover:bg-[rgba(26,26,26,0.05)]"
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Success metric */}
                <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[rgba(26,26,26,0.7)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Success metric
                    </p>
                    <p className="text-base leading-relaxed text-[#1a1a1a]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Onboarding completion rate moves from 10% to 25% within 7 days.
                    </p>
                </div>

                <hr className="border-[rgba(26,26,26,0.12)]" />

                {/* What to do next */}
                <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[rgba(26,26,26,0.7)] mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        What to do next
                    </p>
                    <div className="space-y-2 text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        <p>
                            <span className="text-[#5a8952] font-medium">If improved</span>
                            <span className="text-[rgba(26,26,26,0.7)]"> → Test pricing page next</span>
                        </p>
                        <p>
                            <span className="text-[#1a1a1a] font-medium">If no change</span>
                            <span className="text-[rgba(26,26,26,0.7)]"> → Try value-first demo instead</span>
                        </p>
                        <p>
                            <span className="text-red-600 font-medium">If worsened</span>
                            <span className="text-[rgba(26,26,26,0.7)]"> → Restore original, test headline only</span>
                        </p>
                    </div>
                </div>

                {/* Report Results */}
                <div className="pt-2">
                    <Button
                        variant="outline"
                        className="w-full border-[rgba(26,26,26,0.2)] text-[rgba(26,26,26,0.5)]"
                        disabled
                    >
                        Report Results
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}