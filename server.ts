import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { parseAndEvaluateQueriesRuleBased } from "./src/lib/ruleEngine";
import { getCuratedJournalistIntel } from "./src/lib/journalistIntel";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy init Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not set; using rule-based engine.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// System instructions for HARO/Connectively Pitch Assistant
const SYSTEM_PROMPT = `
You are an expert PR & SEO Pitch Assistant for a PR/SEO manager representing three medical brands under one CEO:

1. Performance P-Wave — Men's sexual health clinic (ED, acoustic wave therapy / shockwave therapy, men's performance/wellness, testosterone, penile health).
   - In-house Expert: Dr. Croley, Medical Director & Men's Sexual Health Specialist at Performance P-Wave

2. Skin & Tonic — Medical spa & aesthetics practice (Botox, fillers, facials, skincare, anti-aging, microneedling, chemical peels, skin barrier repair).
   - In-house Expert: Rixie, Clinical Aesthetics Director & Dr. Croley, Medical Director at Skin & Tonic

3. Dr. Croley's Primary Care — Primary care & general physician practice (general health, prevention, family medicine, checkups, cardiometabolic screening, diagnostic lab testing).
   - In-house Expert: Dr. Croley, MD, Board-Certified Physician at Dr. Croley's Primary Care

STRICT SCOPE RULE:
Only process queries that fall CLEARLY within one of the three categories above. If a query's topic is outside all three (e.g., pharmacists, toxicologists, microbiologists, rheumatologists, chefs, pets, real estate, cybersecurity, education, unrelated business topics), mark it step1_status = "REJECTED" with step1_rejectionReason explaining it is outside scope. Do NOT draft a pitch for it.

ANTI-HALLUCINATION RULE:
Only use information that is explicitly present in the actual HARO digest content provided. Never invent, infer, or borrow text from unrelated parts of the email (like footer text, subscription address lines, or unsubscribe/signup text). Every pitch drafted MUST be tied to one specific numbered query, and MUST correctly quote: the real journalist name, real outlet, real deadline, and real reply+ email address exactly as written in that query. If any of those four fields is missing or unclear, mark step1_status = "REJECTED" and flag it.

HARD DISQUALIFIERS (skip even if topic looks close):
- Query explicitly says "not accepting pitches from third parties" or "no PR companies" or "no agencies".
- Query requires a specific credential none of these three brands have in-house (e.g. must be a pharmacist, toxicologist, commercial bankruptcy attorney) AND says "no alternatives" / "no exceptions".

BRAND ASSIGNMENT (only after scope + disqualifier checks pass):
- Sexual health, ED, testosterone, men's performance → "Performance P-Wave"
- Skincare, injectables, facial aesthetics, anti-aging, med spa → "Skin & Tonic"
- General/preventive health, cardiometabolic screening, family medicine, checkups → "Dr. Croley's"

"NO AI PITCHES" RESTRICTION CHECK:
If query includes any restriction against AI pitches (e.g., "No AI pitches considered", "No AI", "AI responses rejected", "Human pitches only"):
- Mark step3_hasAiRestriction = true
- Pitch text MUST be exactly: "MANUAL PITCH REQUIRED — do not auto-draft AI-style"
- Do not generate an automated pitch body.

COMPLIANCE RULE FOR ANY DRAFTED TEXT:
- Never state a treatment/test "will" cure, fix, transform, guarantee, or eliminate anything. Hedge all claims: use "may help," "is designed to support," "some patients report," "our clinical team observes that," etc.
- Never cite a specific statistic, percentage, or study unless it was explicitly supplied in the prompt — do NOT invent numbers or citations.
- Length: Short draft pitch (3 to 5 sentences).
- Subject Line: Formatted as "HARO: [Specific Insight/Angle] — [Expert Title, Brand]"

OUTPUT SCHEMA (clean JSON):
{
  "summary": "Brief 1-2 sentence overview",
  "queries": [
    {
      "id": "query-1",
      "title": "Topic or Headline",
      "mediaOutlet": "Outlet Name",
      "journalist": "Journalist Name",
      "email": "reply+ email",
      "deadline": "Deadline string",
      "deadlineTimestamp": 1724180000000,
      "queryUrl": "https://app.connectively.us/queries/12345 or direct query link",
      "queryRequirements": "Extracted query requirements",
      "step1_status": "APPROVED" | "REJECTED",
      "step1_rejectionReason": "Reason if rejected",
      "step2_brand": "Performance P-Wave" | "Skin & Tonic" | "Dr. Croley's" | "None",
      "step2_expertTitle": "Expert Name & Title",
      "step3_hasAiRestriction": false,
      "step3_note": "Optional note",
      "step4_pitchSubject": "Subject line",
      "step4_pitchBody": "3-5 sentence hedged pitch text",
      "step4_teaserInsight": "1-2 sentence core clinical takeaway"
    }
  ]
}
`;

// Resilient helper to call Gemini with model fallback and error handling
async function callGeminiSafely(userPrompt: string): Promise<string | null> {
  const ai = getGemini();
  if (!ai) return null;

  const candidateModels = ["gemini-3.7-flash", "gemini-flash-latest"];
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }] }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });
      if (response.text && response.text.trim().length > 0) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} unavailable (${err?.status || err?.message || 'error'}). Trying fallback.`);
    }
  }
  return null;
}

// API endpoint to process HARO/Connectively digest or raw queries
app.post("/api/process-queries", async (req, res) => {
  try {
    const { rawText, queriesList } = req.body;
    const textToProcess = rawText || (queriesList ? JSON.stringify(queriesList, null, 2) : "");

    if (!textToProcess) {
      return res.status(400).json({ error: "Please provide either raw email text or a list of queries." });
    }

    const userPrompt = `
Analyze the following HARO/Connectively content and apply all strict scope, anti-hallucination, disqualification, brand assignment, and compliance rules:

Input Content:
${textToProcess}
`;

    // Attempt AI processing
    const aiResponseText = await callGeminiSafely(userPrompt);
    if (aiResponseText) {
      try {
        const parsed = JSON.parse(aiResponseText);
        if (parsed && Array.isArray(parsed.queries) && parsed.queries.length > 0) {
          parsed.queries = parsed.queries.map((q: any) => ({
            ...q,
            journalistIntelligence: q.journalistIntelligence || getCuratedJournalistIntel(q.journalist || '', q.mediaOutlet || '', q.title || '', q.step2_brand || ''),
          }));
          return res.json(parsed);
        }
      } catch (jsonErr) {
        console.warn("JSON parsing of AI output failed, using rule engine fallback.", jsonErr);
      }
    }

    // High-precision deterministic fallback rule engine (Strict Scope + Compliance)
    const evaluatedQueries = parseAndEvaluateQueriesRuleBased(textToProcess);
    const approved = evaluatedQueries.filter((q) => q.step1_status === "APPROVED").length;
    const rejected = evaluatedQueries.filter((q) => q.step1_status === "REJECTED").length;
    const manual = evaluatedQueries.filter((q) => q.step3_hasAiRestriction).length;

    return res.json({
      summary: `Processed ${evaluatedQueries.length} opportunities (${approved} in-scope & approved, ${rejected} skipped/disqualified, ${manual} manual outreach only).`,
      queries: evaluatedQueries,
    });
  } catch (error: any) {
    console.error("Error in /api/process-queries handler:", error);
    const fallbackQueries = parseAndEvaluateQueriesRuleBased(req.body?.rawText || "");
    return res.json({
      summary: `Evaluated ${fallbackQueries.length} queries according to strict medical PR rules.`,
      queries: fallbackQueries,
    });
  }
});

// API endpoint to regenerate / polish a single pitch with custom adjustments
app.post("/api/refine-pitch", async (req, res) => {
  try {
    const { queryTitle, queryRequirements, brand, expertTitle, currentPitch, feedback } = req.body;
    const ai = getGemini();

    if (ai) {
      try {
        const prompt = `
You are the PR manager for ${brand} representing ${expertTitle}.
Refine the pitch for the following HARO query based on the user's feedback.

Query: ${queryTitle}
Requirements: ${queryRequirements}
Current Pitch: ${currentPitch}
Feedback: ${feedback || "Make it sharper, 3-5 sentences, hedged claims only, and ensure no unverified statistics are present."}

Strict Rules:
- 3 to 5 sentences total.
- Use hedged compliant language: "may help", "is designed to support", "some patients report". Never use "will cure", "will fix", "guarantees", or "transforms".
- Zero unverified statistics or percentages.
- Name expert title & brand clearly.
- State availability before deadline.

Return JSON with:
- "pitchSubject": string
- "pitchBody": string
- "teaserInsight": string
`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json(parsed);
        }
      } catch (geminiErr: any) {
        console.warn("AI refine error, falling back gracefully:", geminiErr?.message);
      }
    }

    return res.json({
      pitchSubject: `HARO: Clinical insight on ${queryTitle || "healthcare topic"} — ${expertTitle}`,
      pitchBody: currentPitch || "Our medical director is available for commentary ahead of your deadline.",
      teaserInsight: "Our clinical protocols focus on addressing root physiological factors with evidence-backed care.",
    });
  } catch (error: any) {
    console.error("Error in /api/refine-pitch:", error);
    return res.json({
      pitchSubject: `HARO Pitch: ${req.body.queryTitle || "Medical Insight"} — ${req.body.expertTitle || req.body.brand}`,
      pitchBody: req.body.currentPitch || "Our clinical director is available for follow-up questions.",
      teaserInsight: "Our clinical protocols focus on supporting patient wellness safely.",
    });
  }
});

/**
 * Helper to fetch real-time Journalist Intelligence using Google Search Grounding with gemini-3.8-flash
 */
async function fetchJournalistIntel(
  journalist: string,
  mediaOutlet: string,
  queryTitle: string = "",
  brand: string = ""
) {
  const ai = getGemini();
  if (ai) {
    try {
      const prompt = `Research the journalist "${journalist}" who writes or reports for "${mediaOutlet}".
Query topic context: "${queryTitle}".
Medical Brand to represent: "${brand}".

Use Google Search grounding to locate:
1. Their recent articles and reporting topics at ${mediaOutlet} or other publications.
2. Their Twitter / X bio, username, and social focus if found.
3. Their primary reporting beat and preferences.
4. A customized, highly effective pitch hook angle tailored for a medical expert pitching them on this topic.

Format your response clearly:
BEAT: [1-2 sentences on their primary beat and focus]
BIO: [Brief professional bio or background summary]
TWITTER_HANDLE: [@handle or N/A]
TWITTER_BIO: [Twitter/X bio or social snippet, or N/A]
RECENT_ARTICLES:
- [Headline 1]
- [Headline 2]
- [Headline 3]
HOOK_ANGLE: [Personalized pitch hook advice and suggested opening sentence tailored to their past reporting]
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const groundingSources: Array<{ title: string; url: string }> = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web?.uri) {
            groundingSources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri,
            });
          }
        }
      }

      const text = response.text || "";
      if (text.trim().length > 0) {
        const beatMatch = text.match(/BEAT:\s*([^\n]+(?:\n[^\n]+)?)/i);
        const bioMatch = text.match(/BIO:\s*([^\n]+(?:\n[^\n]+)?)/i);
        const twitterHandleMatch = text.match(/TWITTER_HANDLE:\s*([^\n]+)/i);
        const twitterBioMatch = text.match(/TWITTER_BIO:\s*([^\n]+)/i);
        const hookMatch = text.match(/HOOK_ANGLE:\s*([^\n]+(?:\n[^\n]+)?)/i);

        const articlesSection = text.match(/RECENT_ARTICLES:([\s\S]*?)(?:HOOK_ANGLE:|$)/i);
        const recentArticles: Array<{ title: string; url: string; snippet?: string }> = [];
        if (articlesSection && articlesSection[1]) {
          const lines = articlesSection[1].split("\n").filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*"));
          lines.slice(0, 3).forEach((line, idx) => {
            const cleanTitle = line.replace(/^[-*]\s*/, "").trim();
            const sourceUrl = groundingSources[idx]?.url || groundingSources[0]?.url || `https://www.google.com/search?q=${encodeURIComponent(journalist + " " + mediaOutlet)}`;
            recentArticles.push({
              title: cleanTitle,
              url: sourceUrl,
              snippet: `Published in ${mediaOutlet}`,
            });
          });
        }

        if (recentArticles.length === 0 && groundingSources.length > 0) {
          groundingSources.slice(0, 3).forEach((src) => {
            recentArticles.push({
              title: src.title,
              url: src.url,
            });
          });
        }

        return {
          journalistName: journalist,
          mediaOutlet,
          beatFocus: beatMatch ? beatMatch[1].trim() : `Healthcare and wellness reporting at ${mediaOutlet}`,
          bioSnippet: bioMatch ? bioMatch[1].trim() : `Reporter and contributing editor at ${mediaOutlet}.`,
          twitterHandle: twitterHandleMatch && !twitterHandleMatch[1].includes("N/A") ? twitterHandleMatch[1].trim() : undefined,
          twitterBio: twitterBioMatch && !twitterBioMatch[1].includes("N/A") ? twitterBioMatch[1].trim() : undefined,
          recentArticles,
          recommendedHookAngle: hookMatch ? hookMatch[1].trim() : `Open by referencing their recent coverage on this topic, stating Dr. Croley's clinical credentials in the first sentence.`,
          groundingSources,
          fetchedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "fetched",
        };
      }
    } catch (err: any) {
      console.warn("Gemini Google Search Grounding error:", err?.message);
    }
  }

  // Curated fallback based on journalist and media outlet
  return getCuratedJournalistIntel(journalist, mediaOutlet, queryTitle, brand);
}

// API endpoint to fetch Google Search Grounded Journalist Intelligence
app.post("/api/fetch-journalist-intel", async (req, res) => {
  try {
    const { journalist, mediaOutlet, queryTitle, brand } = req.body;
    if (!journalist) {
      return res.status(400).json({ error: "Missing journalist parameter" });
    }

    const intel = await fetchJournalistIntel(journalist, mediaOutlet || "", queryTitle || "", brand || "");
    return res.json(intel);
  } catch (error: any) {
    console.error("Error in /api/fetch-journalist-intel:", error);
    const fallback = getCuratedJournalistIntel(req.body.journalist || "", req.body.mediaOutlet || "");
    return res.json(fallback);
  }
});

// Endpoint to inspect and test health of HARO / Connectively source query link
app.get("/api/check-link", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing url parameter", ok: false });
  }

  try {
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === "https:";
    const domain = parsed.hostname;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const startTime = Date.now();
    let status = 0;
    let statusText = "";
    let ok = false;
    let finalUrl = targetUrl;

    try {
      // First try HEAD with standard browser User-Agent
      const fetchRes = await fetch(targetUrl, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });

      status = fetchRes.status;
      statusText = fetchRes.statusText;
      finalUrl = fetchRes.url || targetUrl;
      // 2xx, 3xx or 401/403 (protected behind login/Cloudflare wall like Connectively) indicates an active domain/endpoint
      ok = fetchRes.ok || (status >= 200 && status < 400) || status === 401 || status === 403;
    } catch {
      // Retry with lightweight GET if HEAD was rejected or blocked
      try {
        const getRes = await fetch(targetUrl, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          redirect: "follow",
        });

        status = getRes.status;
        statusText = getRes.statusText;
        finalUrl = getRes.url || targetUrl;
        ok = getRes.ok || (status >= 200 && status < 400) || status === 401 || status === 403;
      } catch (getErr: any) {
        status = 0;
        statusText = getErr?.name === "AbortError" ? "Request Timeout (Server took > 6.5s)" : (getErr?.message || "Connection Failed");
      }
    } finally {
      clearTimeout(timeout);
    }

    const durationMs = Date.now() - startTime;

    let sourceType = "External Media Link";
    if (domain.includes("connectively.us")) {
      sourceType = "Connectively Journalist Platform";
    } else if (domain.includes("helpareporter.com")) {
      sourceType = "HARO Media Portal";
    }

    let note = "Source query link is live and responsive.";
    if (status === 403 || status === 401) {
      note = "Domain is live and active (requires journalist login / protected portal). Link is valid.";
    } else if (status === 404) {
      note = "Source query page returned 404 Not Found. Journalist may have closed the inquiry.";
    } else if (status === 0) {
      note = `Unable to establish connection: ${statusText}`;
    }

    return res.json({
      url: targetUrl,
      finalUrl,
      domain,
      isHttps,
      status,
      statusText,
      ok: ok,
      durationMs,
      sourceType,
      note,
      checkedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    });
  } catch (err: any) {
    return res.status(400).json({
      error: "Invalid URL structure",
      message: err.message,
      url: targetUrl,
      ok: false,
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HARO Pitch Assistant server listening on port ${PORT}`);
  });
}

start();
