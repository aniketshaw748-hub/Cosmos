import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

/**
 * AI tutor endpoint. Proxies the Google Gemini API so GEMINI_API_KEY stays
 * server-side. Accepts { objectName, objectData, question, history } and
 * returns { text } — a vivid, in-character answer about the selected object.
 */

/** Extend the function timeout beyond Vercel's 10s default. */
export const maxDuration = 30;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// flash-lite has a more generous free-tier quota than flash.
const MODEL = 'gemini-2.5-flash-lite';

/** Keep the request small — only the last few turns are sent to the model. */
const MAX_HISTORY = 6;

/** Back-off delays (ms) between retries when the model is rate-limited. */
const BACKOFF_MS = [2000, 4000, 8000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The Cosmos persona — see project spec §7. */
function buildSystemInstruction(objectName: string, objectData: unknown): string {
  return `You are Cosmos, an AI space tutor inside a 3D space exploration app. The user is currently looking at ${objectName} and has the following real data on screen: ${JSON.stringify(
    objectData,
  )}.

Your voice is curious, vivid, and warm — like Kurzgesagt or Cleo Abram. You explain space in a way that makes people lean forward.

Rules:
- Open with the answer, not a preamble.
- Use one concrete analogy per concept (e.g. "Jupiter could fit 1,300 Earths inside it — imagine a basketball next to a peppercorn").
- 2–4 short paragraphs max. This is a panel, not an essay.
- If the user asks something you can't verify, say so honestly and offer what is known.
- End with a "Want to know more?" hook — a follow-up question they could ask.
- Never break character or mention you are an AI model unless directly asked.
- No emojis. No bullet points. Prose only.`;
}

function isRateLimited(message: string): boolean {
  return /\b429\b|RESOURCE_EXHAUSTED|exceeded your current quota|rate.?limit/i.test(message);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[api/chat] GEMINI_API_KEY is not configured');
    return res.status(500).json({ error: 'The AI tutor is not configured.' });
  }

  const body = (req.body ?? {}) as {
    objectName?: string;
    objectData?: unknown;
    question?: string;
    history?: ChatMessage[];
  };

  const objectName = body.objectName?.trim() || 'this object';
  const question = body.question?.trim();
  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];

  if (!question) {
    return res.status(400).json({ error: 'A question is required' });
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = buildSystemInstruction(objectName, body.objectData ?? {});

  const contents = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: question }] },
  ];

  // Observability: how big is the prompt we're shipping to Gemini?
  const payloadChars =
    JSON.stringify(contents).length + systemInstruction.length;
  console.log(
    `[api/chat] object=${objectName} historyTurns=${history.length} payload≈${payloadChars} chars`,
  );

  // Try the request, retrying with exponential back-off if Gemini is rate-limited.
  let lastError = '';
  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction,
          temperature: 0.9,
          maxOutputTokens: 500,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const text = response.text?.trim();
      if (!text) {
        console.error('[api/chat] the model returned an empty response');
        return res.status(502).json({
          error: 'empty-response',
          message: 'That answer ran long — try asking something more specific.',
        });
      }

      return res.status(200).json({ text });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);

      if (isRateLimited(lastError) && attempt < BACKOFF_MS.length) {
        const wait = BACKOFF_MS[attempt];
        console.warn(
          `[api/chat] rate-limited (attempt ${attempt + 1}) — retrying in ${wait}ms`,
        );
        await sleep(wait);
        continue;
      }
      break;
    }
  }

  console.error('[api/chat] generateContent failed:', lastError);

  if (isRateLimited(lastError)) {
    return res.status(429).json({
      error: 'rate-limited',
      message: 'Too many questions too quickly — wait a moment, then try again.',
    });
  }
  return res.status(500).json({
    error: 'unknown',
    message: 'The tutor ran into a problem — please try again.',
  });
}
