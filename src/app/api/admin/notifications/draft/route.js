import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set in environment variables' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemInstruction = `You are an executive copywriter and email architect for 'Automatix', a premium B2B workflow automation platform.
Your task is to draft a professional, dark-themed announcement email based on the prompt provided by the admin.

STRICT RULES:
1. NEVER include emojis in the subject or HTML body. Keep the tone sophisticated, sleek, and executive.
2. Structure the body using clean, semantic HTML suitable for email inboxes:
   - Use <p> for paragraphs with clear line-height.
   - Use <h3> for section titles.
   - Use <ul> and <li> for feature bullet points.
   - Use <strong> for emphasis.
   - You may use personalization tokens: {{USER_NAME}}, {{USER_EMAIL}}, {{SUBSCRIPTION_TIER}}, {{STORAGE_TIER}}, {{EXPIRY_DATE}}, {{APP_URL}}.
3. Return ONLY a valid JSON object with the following exact keys:
   "subject": "Professional email subject without emojis",
   "body": "Clean semantic HTML content"

No markdown backticks around the JSON. Return raw JSON only.`;

    const result = await model.generateContent(`${systemInstruction}\n\nPrompt: ${prompt}`);
    const text = result.response.text();
    
    // Attempt to parse the response as JSON
    const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

    return NextResponse.json({ success: true, subject: parsed.subject, body: parsed.body });

  } catch (error) {
    console.error('Gemini Draft Error:', error);
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
  }
}
