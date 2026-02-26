import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
      {bottlenecks.map((b) => (
        <Link
          key={b.id}
          to={createPageUrl("Growth") + "?bottleneck=" + b.id}
          className="block"
        >
          <Card className="h-full bg-white border border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30 transition-colors cursor-pointer group">
            <CardContent className="p-6">
              <p className="font-mono text-xs uppercase tracking-wider text-[#1a1a1a]/50 mb-2">
                {b.title}
              </p>
              <p className="text-[#1a1a1a] mb-3">
                {b.description}
              </p>
              <p className="text-sm text-[#1a1a1a]/50 italic mb-4">
                {b.symptom}
              </p>
              <span className="text-[#A03814] text-sm group-hover:translate-x-1 inline-block transition-transform">
                Start →
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default BottleneckSelector;
