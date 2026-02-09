import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

interface RefineRequest {
  fieldName: string;
  currentValue: string;
  context?: {
    crawledData?: Record<string, unknown>;
    formData?: Record<string, unknown>;
  };
  refinementType: 'clarify' | 'expand' | 'simplify' | 'align';
}

const REFINEMENT_GOALS: Record<string, string> = {
  clarify: 'Make it more specific and concrete. Remove vague language. Add concrete details from the context.',
  expand: 'Add more detail and context. Make it more comprehensive while staying focused and accurate.',
  simplify: 'Make it more concise and direct. Remove unnecessary words. Keep only essential information.',
  align: 'Better align with evidence from the crawled website data. Ensure consistency with the actual business.',
};

const BRAND_VOICE = `
BRAND VOICE CONSTRAINTS:
- Direct and economical language
- No hype words: seamless, powerful, leverage, robust, solution, unlock, elevate, streamline, game-changer
- No em dashes
- No rhetorical questions
- One clear idea per sentence
- Calm, confident, exacting tone
`;

function buildPrompt(
  fieldName: string,
  currentValue: string,
  context: Record<string, unknown> | undefined,
  refinementType: string
): string {
  const crawledData = context?.crawledData as Record<string, unknown> | undefined;
  const formData = context?.formData as Record<string, unknown> | undefined;

  let contextBlock = '';
  if (crawledData) {
    contextBlock = `
WEBSITE DATA (for context):
- Business: ${crawledData.company_name || 'Unknown'}
- Description: ${crawledData.product_description || 'Not detected'}
`;
  }
  if (formData) {
    contextBlock += `
FORM DATA:
- Product name: ${formData.company_name || ''}
- Country: ${formData.country || ''}
`;
  }

  return `You are a legal document assistant helping refine form field content for GDPR-compliant documents.

FIELD: ${fieldName}
CURRENT VALUE: "${currentValue}"
${contextBlock}
REFINEMENT GOAL: ${REFINEMENT_GOALS[refinementType] || REFINEMENT_GOALS.clarify}

${BRAND_VOICE}

TASK: Refine the current value according to the refinement goal while adhering to brand voice constraints.
Do NOT invent new features or facts. Only refine what the user already wrote.

OUTPUT FORMAT (JSON only, no markdown, no code fences):
{
  "refined": "Your refined version",
  "alternatives": ["Alternative version 1", "Alternative version 2"],
  "rationale": "Brief explanation of what you changed and why"
}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { fieldName, currentValue, context, refinementType }: RefineRequest = await req.json();

    if (!currentValue?.trim()) {
      return Response.json({ success: false, error: 'No value to refine' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ success: false, error: 'AI service not configured' }, { status: 500 });
    }

    const prompt = buildPrompt(fieldName, currentValue, context, refinementType || 'clarify');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const responseText = result.response.text().trim();

    // Strip markdown code fences if present
    const jsonText = responseText
      .replace(/^```json?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      // If JSON parsing fails, construct a basic response
      parsed = {
        refined: responseText.substring(0, 500),
        alternatives: [],
        rationale: 'AI generated a plain text refinement.',
      };
    }

    return Response.json({
      success: true,
      refined: parsed.refined || currentValue,
      alternatives: parsed.alternatives || [],
      rationale: parsed.rationale || '',
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to refine field. Please try again.',
    }, { status: 500 });
  }
});
