// Load premium session data after Stripe payment
// Retrieves stored form data and radar data for PremiumBuilder page

import { createClient } from "npm:@vercel/kv@1.0.1";

const kvUrl = Deno.env.get("KV_REST_API_URL");
const kvToken = Deno.env.get("KV_REST_API_TOKEN");
const kv = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null;

interface SessionRequest {
  sessionId: string;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const { sessionId }: SessionRequest = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: "Session ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Try KV store first
    if (kv) {
      try {
        const formData = await kv.get(`session:${sessionId}:formData`);
        const radarData = await kv.get(`session:${sessionId}:radar`);

        if (formData) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                formData,
                radarData: radarData || null,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error("KV read failed:", error);
      }
    }

    // If no KV data found, return empty but successful response
    // The frontend will fall back to localStorage data
    return new Response(
      JSON.stringify({
        success: false,
        error: "Session not found. Loading from local storage.",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("getPremiumSession error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to load session",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
