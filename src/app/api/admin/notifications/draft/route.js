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

    const systemInstruction = `You are an expert copywriter for the software platform 'Automatix'. 
Your task is to draft an announcement email based on the prompt provided by the admin.
Keep the tone professional, friendly, and non-technical. Focus on how the updates benefit the user.
Return ONLY a valid JSON object with the following exact keys:
"subject": A catchy email subject
"body": The email body formatted properly with line breaks

No markdown backticks around the JSON. Just raw JSON.`;

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
