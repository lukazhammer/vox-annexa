import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productDescription, currentState, bottleneck } = await req.json();

    if (!productDescription || !currentState || !bottleneck) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validBottlenecks = ['acquisition', 'activation', 'retention', 'referral'];
    if (!validBottlenecks.includes(bottleneck)) {
      return Response.json({ error: 'Invalid bottleneck type' }, { status: 400 });
    }

    const startTime = Date.now();

    const prompt = `You are a growth advisor for indie SaaS products. You provide ONE focused experiment at a time.

PRODUCT: ${productDescription}

CURRENT SITUATION: ${currentState}

BOTTLENECK: ${bottleneck}

Based on this context, diagnose the highest-leverage experiment to run right now.

Rules:
1. ONE experiment only — the most impactful given current state
2. Hypothesis must be falsifiable
3. Variant content must be copy-paste ready (actual text they can use)
4. Implementation prompt must work in Bolt, Cursor, or Lovable
5. Success metric must be specific and measurable (numbers, not vague)
6. Duration should be realistic (typically 7-14 days)
7. Next moves should be specific actions based on each possible outcome

Respond in JSON format matching this schema exactly:
{
  "diagnosis": {
    "primaryIssue": "string - the core problem you've identified",
    "confidence": "high" | "medium" | "low",
    "reasoning": "string - why you believe this is the issue"
  },
  "experiment": {
    "title": "string - short name for the experiment",
    "hypothesis": "string - falsifiable hypothesis statement",
    "variant": {
      "type": "headline" | "cta" | "email" | "onboarding_step" | "feature_highlight",
      "content": "string - copy-paste ready text",
      "context": "string - where to use it"
    },
    "implementationPrompt": "string - ready for Bolt/Cursor/Lovable",
    "successMetric": "string - specific and measurable",
    "measurementPlan": "string - how to measure",
    "durationDays": number
  },
  "nextMoves": {
    "ifImproved": "string - specific action if metric improves",
    "ifNoChange": "string - specific action if no change",
    "ifWorsened": "string - specific action if metric worsens"
  }
}

Output ONLY valid JSON, no markdown, no code blocks, just JSON.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let sprintData;
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      sprintData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Raw text:', text);
      throw new Error('Failed to parse AI response');
    }

    // Generate experiment ID
    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const duration = Date.now() - startTime;
    console.log(`Growth sprint generated in ${duration}ms for bottleneck: ${bottleneck}`);

    return Response.json({
      success: true,
      experimentId,
      ...sprintData
    });

  } catch (error) {
    console.error('Growth sprint error:', error);

    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});