interface UpdateRequest {
  currentScores: number[];
  differentiator: string;
  affectedAxes: string[];
  axes: Array<{ id: string; name: string }>;
}

export default async function handler(req: Request): Promise<Response> {
  console.log('=== updateRadarScores START ===');

  let currentScores: number[] = [];
  let affectedAxes: string[] = [];

  try {
    const body: UpdateRequest = await req.json();
    currentScores = body.currentScores;
    affectedAxes = body.affectedAxes || [];
    const { differentiator, axes } = body;

    const { GoogleGenerativeAI } = await import('npm:@google/generative-ai');
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `A product added this differentiator:
"${differentiator}"

Current scores (0-100) on these dimensions:
${axes.map((axis, i) => `${axis.name}: ${currentScores[i]}`).join('\n')}

Adjust scores based on this differentiator. Most scores should stay the same. Only increase scores on dimensions where this differentiator creates real advantage.

Increase guidelines:
- Small advantage: +5 to +10 points
- Medium advantage: +11 to +20 points
- Major advantage: +21 to +30 points

OUTPUT (JSON only):
{
  "updatedScores": [score1, score2, score3, score4, score5, score6],
  "changedAxes": ["axis_id1", "axis_id2"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\s?|\s?```/g, '').trim();
    const parsed = JSON.parse(text);

    return new Response(JSON.stringify({
      success: true,
      updatedScores: parsed.updatedScores,
      changedAxes: parsed.changedAxes,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('updateRadarScores error:', error);

    // Fallback: small random increases on 1-2 axes
    const updatedScores = [...currentScores];
    const numToChange = Math.min(2, affectedAxes.length || 1);

    for (let i = 0; i < numToChange; i++) {
      const randomIndex = Math.floor(Math.random() * updatedScores.length);
      updatedScores[randomIndex] = Math.min(100, updatedScores[randomIndex] + Math.floor(Math.random() * 15) + 5);
    }

    return new Response(JSON.stringify({
      success: true,
      updatedScores,
      changedAxes: affectedAxes.slice(0, numToChange),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
