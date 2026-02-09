// Generate competitive axes using Gemini 2.0 Flash
// Returns 6-8 market-specific dimensions for radar chart

import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

export default async function handler(req: Request) {
    try {
        const body = await req.json();
        const { userProduct, competitor } = body;
        // Also accept alternative parameter names from URLCapture flow
        const userBusiness = body.userBusiness || userProduct?.name || '';
        const userIndustry = body.userIndustry || '';

        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            return new Response(JSON.stringify({
                error: 'GEMINI_API_KEY not configured'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are analyzing competitive positioning for SaaS products.

USER'S PRODUCT:
Name: ${userBusiness || userProduct?.name || 'Not provided'}
Industry: ${userIndustry || 'SaaS'}
Description: ${userProduct?.description || 'Not provided'}
Target audience: ${userProduct?.targetPersona || 'Not specified'}

COMPETITOR:
Name: ${competitor?.name || 'Unknown'}
URL: ${competitor?.url || body.competitorURL || 'Not provided'}
Scraped content: ${competitor?.content?.substring(0, 2000) || competitor?.description || 'Limited content available'}

TASK:
Generate 6-8 competitive dimensions that differentiate these products.
Each dimension must be:
1. Measurable or perceivable by customers
2. Relevant to this specific market
3. Meaningful for positioning decisions

For each dimension, provide:
- id: snake_case identifier (e.g., "ease_of_use")
- name: Short label for radar chart (2-4 words, e.g., "Ease of Use")
- description: One sentence explaining what this measures
- lowLabel: What a low score means (e.g., "Complex learning curve")
- highLabel: What a high score means (e.g., "Instant clarity")

Return ONLY valid JSON with this exact structure:
{
  "axes": [
    {
      "id": "ease_of_use",
      "name": "Ease of Use",
      "description": "How intuitive the product is for new users",
      "lowLabel": "Complex learning curve",
      "highLabel": "Instant clarity"
    }
  ]
}

Do not include any markdown formatting, code fences, or explanatory text.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Strip markdown fences if present
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(cleaned);

        // Validate structure
        if (!parsed.axes || !Array.isArray(parsed.axes)) {
            throw new Error('Invalid response structure: missing axes array');
        }

        // Limit to 8 axes maximum
        if (parsed.axes.length > 8) {
            parsed.axes = parsed.axes.slice(0, 8);
        }

        // Ensure minimum of 6 axes
        if (parsed.axes.length < 6) {
            console.warn(`Only ${parsed.axes.length} axes generated, expected 6-8`);
        }

        return new Response(JSON.stringify(parsed), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('generateCompetitiveAxes error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to generate competitive axes',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
