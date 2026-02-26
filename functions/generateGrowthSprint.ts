import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
4. Implementation prompt must be platform-agnostic (works in any AI coding tool). Format it like this:
   - State what to change clearly (e.g., "Update the primary CTA button text on the signup page to: 'Your New Text'")
   - Include specific requirements/constraints as bullet points (e.g., "Keep button styling unchanged", "Ensure visible on mobile and desktop")
   - Do NOT mention any specific platform or tool by name (no "Use Bolt", "In Cursor", etc.)
   - Include testing requirements (e.g., "Test that the button still links correctly")
5. Success metric must be specific and measurable (numbers, not vague)
6. Duration should be realistic (typically 7-14 days)
7. Next moves should be specific actions based on each possible outcome`;

    const responseSchema = {
      type: "object",
      properties: {
        diagnosis: {
          type: "object",
          properties: {
            primaryIssue: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            reasoning: { type: "string" }
          },
          required: ["primaryIssue", "confidence", "reasoning"]
        },
        experiment: {
          type: "object",
          properties: {
            title: { type: "string" },
            hypothesis: { type: "string" },
            variant: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["headline", "cta", "email", "onboarding_step", "feature_highlight"] },
                content: { type: "string" },
                context: { type: "string" }
              },
              required: ["type", "content", "context"]
            },
            implementationPrompt: { type: "string" },
            successMetric: { type: "string" },
            measurementPlan: { type: "string" },
            durationDays: { type: "number" }
          },
          required: ["title", "hypothesis", "variant", "implementationPrompt", "successMetric", "measurementPlan", "durationDays"]
        },
        nextMoves: {
          type: "object",
          properties: {
            ifImproved: { type: "string" },
            ifNoChange: { type: "string" },
            ifWorsened: { type: "string" }
          },
          required: ["ifImproved", "ifNoChange", "ifWorsened"]
        }
      },
      required: ["diagnosis", "experiment", "nextMoves"]
    };

    const sprintData = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: responseSchema
    });

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