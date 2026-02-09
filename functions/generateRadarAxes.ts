interface GenerateAxesRequest {
  userIndustry: string;
  userName: string;
  competitorName: string;
  competitorIndustry: string;
}

interface Axis {
  id: string;
  name: string;
  description: string;
  lowLabel: string;
  highLabel: string;
}

export default async function handler(req: Request): Promise<Response> {
  console.log('=== generateRadarAxes START ===');

  try {
    const { userIndustry, userName, competitorName, competitorIndustry }: GenerateAxesRequest = await req.json();

    const { GoogleGenerativeAI } = await import('npm:@google/generative-ai');
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Generate 6 competitive dimensions for comparing products in the ${userIndustry} industry.

User: ${userName}
Competitor: ${competitorName}

Requirements:
- Dimensions must be specific to ${userIndustry}
- Must be measurable and comparable
- Must be relevant to customer decision-making
- Must be distinct from each other
- Use business language, not jargon

Examples for SaaS:
- Ease of Use (Complex learning curve -> Simple, intuitive)
- Feature Depth (Basic functionality -> Comprehensive features)
- Price Positioning (Budget-friendly -> Premium pricing)

OUTPUT (JSON only, no markdown):
{
  "axes": [
    {
      "id": "ease_of_use",
      "name": "Ease of Use",
      "description": "How intuitive the product is for new users",
      "lowLabel": "Complex, steep learning curve",
      "highLabel": "Simple, instant clarity"
    },
    ...6 total
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\s?|\s?```/g, '').trim();
    const parsed = JSON.parse(text);

    console.log('Generated axes:', parsed.axes.length);

    return new Response(JSON.stringify({
      success: true,
      axes: parsed.axes,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('generateRadarAxes error:', error);

    // Fallback to generic axes
    const fallbackAxes: Axis[] = [
      {
        id: 'ease_of_use',
        name: 'Ease of Use',
        description: 'How simple the product is to use',
        lowLabel: 'Complex',
        highLabel: 'Simple',
      },
      {
        id: 'feature_depth',
        name: 'Feature Depth',
        description: 'Breadth of functionality',
        lowLabel: 'Basic',
        highLabel: 'Comprehensive',
      },
      {
        id: 'price',
        name: 'Price Positioning',
        description: 'Cost relative to market',
        lowLabel: 'Budget',
        highLabel: 'Premium',
      },
      {
        id: 'customization',
        name: 'Customization',
        description: 'Flexibility and configurability',
        lowLabel: 'Rigid',
        highLabel: 'Flexible',
      },
      {
        id: 'onboarding',
        name: 'Onboarding Speed',
        description: 'Time to first value',
        lowLabel: 'Slow',
        highLabel: 'Fast',
      },
      {
        id: 'enterprise',
        name: 'Enterprise Ready',
        description: 'Compliance, security, scale',
        lowLabel: 'Small teams',
        highLabel: 'Enterprise-grade',
      },
    ];

    return new Response(JSON.stringify({
      success: true,
      axes: fallbackAxes,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
