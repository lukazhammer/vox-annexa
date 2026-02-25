import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const bottlenecks = [
    {
        id: 'acquisition',
        title: 'Acquisition',
        description: 'Getting people to your site or app',
        symptom: '"Traffic but no signups"',
    },
    {
        id: 'activation',
        title: 'Activation',
        description: 'Getting signups to their first win',
        symptom: '"Signups but no engagement"',
    },
    {
        id: 'retention',
        title: 'Retention',
        description: 'Keeping users coming back',
        symptom: '"Active users going quiet"',
    },
    {
        id: 'referral',
        title: 'Referral',
        description: 'Getting users to bring others',
        symptom: '"Happy users but no word of mouth"',
    },
];

export function BottleneckSelector() {
    const navigate = useNavigate();

    const handleSelect = (bottleneckId) => {
        navigate(createPageUrl('Growth') + `?bottleneck=${bottleneckId}`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {bottlenecks.map((b) => (
                <Card
                    key={b.id}
                    className="bg-white border-[rgba(26,26,26,0.12)] hover:border-[rgba(26,26,26,0.2)] transition-colors duration-150 cursor-pointer group"
                    onClick={() => handleSelect(b.id)}
                >
                    <CardContent className="p-6">
                        <p className="font-mono text-xs uppercase tracking-wider text-[rgba(26,26,26,0.7)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {b.title}
                        </p>
                        <p className="text-base text-[#1a1a1a] mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {b.description}
                        </p>
                        <p className="text-sm text-[rgba(26,26,26,0.7)] italic mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {b.symptom}
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#A03814] hover:text-[#A03814] hover:bg-transparent group-hover:translate-x-1 transition-transform duration-150 px-0"
                        >
                            Start →
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}