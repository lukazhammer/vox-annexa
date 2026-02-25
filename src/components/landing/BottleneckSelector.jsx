import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
        navigate(`/growth?bottleneck=${bottleneckId}`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {bottlenecks.map((b) => (
                <Card
                    key={b.id}
                    className="bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-strong)] transition-colors duration-150 cursor-pointer group"
                    onClick={() => handleSelect(b.id)}
                >
                    <CardContent className="p-6">
                        <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                            {b.title}
                        </p>
                        <p className="font-body text-base text-[var(--text)] mb-3">
                            {b.description}
                        </p>
                        <p className="font-body text-sm text-[var(--text-muted)] italic mb-4">
                            {b.symptom}
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[var(--accent)] hover:text-[var(--accent)] hover:bg-transparent group-hover:translate-x-1 transition-transform duration-150 px-0"
                        >
                            Start →
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}