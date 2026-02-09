interface SuggestionRequest {
  fieldName: string;
  currentValue: string;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const { fieldName, currentValue }: SuggestionRequest = await req.json();

    const { GoogleGenerativeAI } = await import('npm:@google/generative-ai');
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompts: Record<string, string> = {
      problemStatement: `Generate 3 clear problem statements for a SaaS product.
Current: "${currentValue}"

Make them:
- Specific and concrete
- Customer-focused (not product-focused)
- One sentence each

OUTPUT (JSON):
{ "suggestions": ["statement1", "statement2", "statement3"] }`,

      valueProposition: `Generate 3 value propositions.
Current: "${currentValue}"

Make them:
- Outcome-focused (what user achieves)
- Quantifiable when possible
- One sentence each

OUTPUT (JSON):
{ "suggestions": ["prop1", "prop2", "prop3"] }`,

      differentiator: `Generate 3 differentiation statements.
Current: "${currentValue}"

Start with:
- "Unlike competitors, we..."
- "What makes us different is..."
- "We're the only ones who..."

OUTPUT (JSON):
{ "suggestions": ["diff1", "diff2", "diff3"] }`,
    };

    const prompt = prompts[fieldName] || prompts.problemStatement;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\s?|\s?```/g, '').trim();
    const parsed = JSON.parse(text);

    return new Response(JSON.stringify({
      success: true,
      suggestions: parsed.suggestions,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('generateFieldSuggestions error:', error);

    return new Response(JSON.stringify({
      success: false,
      suggestions: [],
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
