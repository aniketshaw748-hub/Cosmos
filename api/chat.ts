import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

/**
 * AI tutor endpoint. Proxies the Google Gemini API so GEMINI_API_KEY stays
 * server-side. Accepts { objectName, objectData, question, history } and
 * returns { text } — a vivid, in-character answer about the selected object.
 */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MODEL = 'gemini-2.5-flash';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  const body = (req.body ?? {}) as {
    objectName?: string;
    objectData?: unknown;
    question?: string;
    history?: ChatMessage[];
  };

  const objectName = body.objectName?.trim() || 'this object';
  const question = body.question?.trim();
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

  if (!question) {
    return res.status(400).json({ error: 'A question is required' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const contents = [
      ...history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: question }] },
    ];

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: buildSystemInstruction(objectName, body.objectData ?? {}),
        temperature: 0.9,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return res.status(502).json({ error: 'The tutor returned an empty response' });
    }

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(502).json({ error: (err as Error).message });
  }
}
