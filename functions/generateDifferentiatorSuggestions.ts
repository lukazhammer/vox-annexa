// Generate AI-powered differentiator suggestions based on competitor analysis
// Uses Gemini 2.0 Flash to identify positioning gaps and suggest actionable strategies

import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

interface SuggestionRequest {
  userBusiness: {
    name: string;
    description: string;
    industry?: string;
  };
  competitors: Array<{
    name: string;
    positioning: string;
    audience: string;
    focus: string;
  }>;
  existingDifferentiators: string[];
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const {
      userBusiness,
      competitors,
      existingDifferentiators,
    }: SuggestionRequest = await req.json();

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      // Return fallback suggestions if API key is missing
      return new Response(
        JSON.stringify({
          success: true,
          suggestions: getFallbackSuggestions(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate 5 specific differentiation strategies for this business.

USER BUSINESS:
- Name: ${userBusiness.name}
- Description: ${userBusiness.description}
- Industry: ${userBusiness.industry || "SaaS"}

COMPETITORS:
${competitors
  .map(
    (c) => `
- ${c.name}
  Positioning: ${c.positioning}
  Target: ${c.audience}
  Focus: ${c.focus}
`
  )
  .join("\n")}

EXISTING DIFFERENTIATORS:
${
  existingDifferentiators && existingDifferentiators.length > 0
    ? existingDifferentiators.map((d) => `- ${d}`).join("\n")
    : "None yet"
}

Generate differentiation strategies that:
1. Are SPECIFIC to this market (not generic)
2. Highlight gaps in competitor offerings
3. Are ACTIONABLE positioning statements
4. Don't repeat existing differentiators
5. Start with action words or "Unlike competitors..."

EXAMPLES (format to match):
- "10x faster onboarding than enterprise tools"
- "Built for solo developers, not marketing teams"
- "Unlike competitors, we don't require technical setup"
- "Free tier that actually works for production use"
- "No per-user pricing - flat rate for unlimited team"

Return ONLY valid JSON (no markdown, no code fences):
{
  "suggestions": [
    "Suggestion 1 here",
    "Suggestion 2 here",
    "Suggestion 3 here",
    "Suggestion 4 here",
    "Suggestion 5 here"
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json\s?|\s?```/g, "")
      .trim();
    const parsed = JSON.parse(text);

    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      throw new Error("Invalid suggestions structure");
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: parsed.suggestions.slice(0, 5),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generateDifferentiatorSuggestions error:", error);

    // Return fallback suggestions on error
    return new Response(
      JSON.stringify({
        success: true,
        suggestions: getFallbackSuggestions(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

function getFallbackSuggestions(): string[] {
  return [
    "Faster time to value than enterprise alternatives",
    "Built for your specific use case, not general purpose",
    "Simpler pricing with no hidden fees",
    "Better customer support response times",
    "More flexible customization options",
  ];
}
