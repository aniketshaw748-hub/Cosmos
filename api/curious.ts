import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

/**
 * Curious AI endpoint. Generates 1-2 curiosity-sparking questions about what
 * the user is currently looking at, in a vivid "opens a door" voice. Failures
 * return an empty list rather than an error — a missing nudge is harmless.
 */

export const maxDuration = 20;

const MODEL = 'gemini-2.5-flash-lite';

const SYSTEM_INSTRUCTION = `You write curiosity-sparking questions for a 3D space-exploration app used by curious kids and lifelong learners.

Generate questions a curious 12-year-old wouldn't know to ask but would love to. Surprise them with the angle — vivid, and opening a door rather than answering it.

Format rules: each question is a single sentence ending in a question mark, 15 words maximum. No preamble. No numbering. One question per line.

Calibration — learn the difference:
- BAD (boring): "What is Saturn made of?"  -> GOOD: "Did you know Saturn could float in water?"
- BAD (Wikipedia): "How old is the Moon?"  -> GOOD: "Want to see the night the Moon was born?"
- BAD (closed): "Is Mars red?"  -> GOOD: "Why is Mars's blood-red colour actually rust?"`;

function triggerReason(trigger: string, zoom: string): string {
  switch (trigger) {
    case 'idle':
      return 'they have been quietly gazing at it for a while';
    case 'dissection':
      return 'they have cut it open and are studying its inner layers';
    case 'timeline':
      return "they paused on this moment in the solar system's history";
    case 'zoom':
      return zoom === 'in'
        ? 'they zoomed in extremely close to its surface'
        : 'they zoomed far out for a wide, distant perspective';
    case 'post-chat':
      return 'their last question was answered and they fell quiet';
    case 'surprise':
      return 'it was just revealed to them at random by the Surprise Me button';
    default:
      return 'they are exploring it';
  }
}

interface CuriousBody {
  objectName?: string;
  objectKind?: string;
  objectFacts?: string;
  dissected?: boolean;
  zoom?: 'in' | 'out' | 'normal';
  trigger?: string;
  askedQuestions?: string[];
  recentObjects?: string[];
  taste?: { tapped?: string[]; dismissed?: string[] };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ questions: [] });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[api/curious] GEMINI_API_KEY is not configured');
    return res.status(200).json({ questions: [] });
  }

  const b = (req.body ?? {}) as CuriousBody;
  const objectName = b.objectName?.trim() || 'this object';
  const objectKind = b.objectKind?.trim() || '';
  const zoom = b.zoom ?? 'normal';
  const trigger = b.trigger ?? 'idle';
  const asked = Array.isArray(b.askedQuestions) ? b.askedQuestions.slice(-8) : [];
  const recent = Array.isArray(b.recentObjects) ? b.recentObjects.slice(0, 6) : [];
  const liked = Array.isArray(b.taste?.tapped) ? b.taste!.tapped!.slice(-4) : [];

  const userMessage = `The user is exploring ${objectName}${
    objectKind ? ` (a ${objectKind})` : ''
  }.
On-screen facts: ${b.objectFacts?.trim() || 'none given'}.
Right now ${triggerReason(trigger, zoom)}.
Scene state: ${b.dissected ? 'dissected open to reveal its interior layers' : 'viewed from the outside'}; zoom level is ${zoom}.
Questions they already asked this session: ${asked.length ? asked.join(' / ') : 'none yet'}.
They recently looked at: ${recent.length ? recent.join(', ') : 'nothing else yet'}.
${liked.length ? `They previously loved questions like: ${liked.join(' / ')}.` : ''}

Write TWO different curiosity questions about ${objectName}, each on its own line. Do not repeat anything they already asked.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.15,
        maxOutputTokens: 200,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const questions = (response.text ?? '')
      .split('\n')
      .map((line) => line.replace(/^[\s\-*•\d.)]+/, '').trim())
      .filter((line) => line.endsWith('?') && line.length > 8 && line.length < 160)
      .slice(0, 2);

    return res.status(200).json({ questions });
  } catch (err) {
    console.error('[api/curious] generation failed:', err instanceof Error ? err.message : err);
    return res.status(200).json({ questions: [] });
  }
}
