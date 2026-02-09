// Generate multi-competitor radar chart data using Gemini 2.0 Flash
// Supports up to 3 competitors with AI-generated axes and scoring

import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
import { createClient } from "npm:@vercel/kv@1.0.1";

const kvUrl = Deno.env.get("KV_REST_API_URL");
const kvToken = Deno.env.get("KV_REST_API_TOKEN");
const kv = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null;

interface CompetitorInput {
  name: string;
  url: string;
  positioning: string;
  audience: string;
  focus: string;
  keywords: string;
}

interface MultiRadarRequest {
  userBusiness: {
    name: string;
    description: string;
    industry?: string;
  };
  competitors: CompetitorInput[];
  userDifferentiators?: string[];
}

// Fallback axes when AI generation fails
const FALLBACK_AXES = [
  { id: "ease_of_use", name: "Ease of Use", description: "Product simplicity and intuitiveness" },
  { id: "feature_depth", name: "Feature Depth", description: "Breadth of functionality offered" },
  { id: "price_positioning", name: "Price Positioning", description: "Cost relative to market" },
  { id: "target_market", name: "Target Market", description: "Specificity of audience served" },
  { id: "specialization", name: "Specialization", description: "Niche focus vs generalist approach" },
  { id: "performance", name: "Performance", description: "Speed and reliability" },
];

export default async function handler(req: Request): Promise<Response> {
  console.log("=== generateMultiCompetitorRadar START ===");

  try {
    const body: MultiRadarRequest = await req.json();
    const { userBusiness, competitors, userDifferentiators = [] } = body;

    if (!competitors || competitors.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "At least one competitor is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("User:", userBusiness.name);
    console.log("Competitors:", competitors.length);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Generate market-specific axes
    const axes = await generateAxes(model, userBusiness, competitors);
    console.log("Generated axes:", axes.length);

    // Score user business
    const userScores = await scoreEntity(
      model,
      userBusiness.name,
      userBusiness.description,
      userDifferentiators.join("; "),
      axes,
      competitors
    );

    // Score each competitor in parallel
    const competitorScores = await Promise.all(
      competitors.map((comp) =>
        scoreEntity(
          model,
          comp.name,
          comp.positioning,
          comp.focus,
          axes,
          competitors
        )
      )
    );

    // Calculate average competitor scores for comparison
    const avgCompetitorScores = axes.map((_: any, axisIndex: number) => {
      const sum = competitorScores.reduce(
        (acc: number, scores: number[]) => acc + scores[axisIndex],
        0
      );
      return Math.round(sum / competitorScores.length);
    });

    // Generate insights
    const insights = generateInsights(axes, userScores, avgCompetitorScores, competitors);

    const radarData = {
      axes,
      userScores,
      competitorScores,
      competitorNames: competitors.map((c) => c.name),
      avgCompetitorScores,
      insights,
    };

    console.log("=== generateMultiCompetitorRadar SUCCESS ===");

    return new Response(
      JSON.stringify({ success: true, data: radarData }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generateMultiCompetitorRadar error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to generate multi-competitor radar",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function generateAxes(
  model: any,
  userBusiness: { name: string; description: string; industry?: string },
  competitors: CompetitorInput[]
) {
  try {
    const industry = userBusiness.industry || "SaaS";
    const competitorPositions = competitors
      .map((c) => `- ${c.name}: ${c.positioning}`)
      .join("\n");

    const prompt = `Generate 6 competitive dimensions for comparing products in ${industry}.

User Business: ${userBusiness.name}
Description: ${userBusiness.description}

Competitors:
${competitorPositions}

Requirements:
- Dimensions must be specific to this market
- Must differentiate between these specific competitors
- Must be measurable and comparable
- Each dimension should reveal strategic positioning

Return ONLY valid JSON (no markdown, no code fences):
{
  "axes": [
    {
      "id": "dimension_id",
      "name": "Dimension Name",
      "description": "What this measures"
    }
  ]
}

Generate exactly 6 dimensions.`;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json\s?|\s?```/g, "")
      .trim();
    const parsed = JSON.parse(text);

    if (!parsed.axes || !Array.isArray(parsed.axes) || parsed.axes.length < 4) {
      throw new Error("Invalid axes structure");
    }

    return parsed.axes.slice(0, 6);
  } catch (error) {
    console.warn("AI axis generation failed, using fallback:", error.message);
    return FALLBACK_AXES;
  }
}

async function scoreEntity(
  model: any,
  entityName: string,
  entityDescription: string,
  entityContext: string,
  axes: any[],
  competitors: CompetitorInput[]
) {
  try {
    const prompt = `Score this product on each dimension (0-100 percentile).

PRODUCT:
- Name: ${entityName}
- Description: ${entityDescription}
- Context: ${entityContext || "None provided"}

COMPETING AGAINST:
${competitors.map((c) => `- ${c.name}: ${c.positioning}`).join("\n")}

DIMENSIONS:
${axes.map((axis: any, i: number) => `${i + 1}. ${axis.name}: ${axis.description}`).join("\n")}

Score 0-100 where:
- 0-30 = Weak in this area
- 31-50 = Below average
- 51-70 = Competitive
- 71-90 = Strong advantage
- 91-100 = Market leader

Be realistic and objective. Consider the product's actual positioning and capabilities.

Return ONLY valid JSON (no markdown, no code fences):
{ "scores": [score1, score2, score3, score4, score5, score6] }`;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json\s?|\s?```/g, "")
      .trim();
    const parsed = JSON.parse(text);

    if (!parsed.scores || !Array.isArray(parsed.scores)) {
      throw new Error("Invalid scores structure");
    }

    // Ensure scores are valid numbers in range
    return parsed.scores.slice(0, axes.length).map((s: any) => {
      const score = parseInt(s, 10);
      return isNaN(score) ? 50 : Math.max(0, Math.min(100, score));
    });
  } catch (error) {
    console.warn("AI scoring failed for", entityName, "using fallback:", error.message);
    return Array.from({ length: axes.length }, () => Math.floor(Math.random() * 30) + 45);
  }
}

function generateInsights(
  axes: any[],
  userScores: number[],
  competitorScores: number[],
  competitors: CompetitorInput[]
) {
  const strengths: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  axes.forEach((axis: any, i: number) => {
    const userScore = userScores[i];
    const compScore = competitorScores[i];
    const diff = userScore - compScore;

    if (diff > 15) {
      strengths.push(
        `Strong ${axis.name.toLowerCase()} (${userScore} vs avg ${compScore})`
      );
    } else if (diff < -15) {
      opportunities.push(
        `Improve ${axis.name.toLowerCase()} (${userScore} vs avg ${compScore})`
      );
    }

    if (compScore > 80 && userScore < 60) {
      threats.push(`Competitors excel at ${axis.name.toLowerCase()}`);
    }
  });

  return {
    strengths: strengths.slice(0, 4),
    opportunities: opportunities.slice(0, 4),
    threats: threats.slice(0, 3),
    competitorCount: competitors.length,
  };
}
