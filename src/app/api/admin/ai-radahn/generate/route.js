import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { mode, selectedDeployments = [], customNotes = '', tone = 'feature_release', subject = '', body = '', instruction = '' } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in environment variables.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let systemInstruction = '';
    let userPrompt = '';

    if (mode === 'ANNOUNCEMENT_FROM_DEPLOYMENTS') {
      const deploymentsText = selectedDeployments.length > 0 
        ? selectedDeployments.map((d, i) => `${i + 1}. ${typeof d === 'string' ? d : d.message}`).join('\n')
        : 'Platform performance improvements, workflow optimization, and enhanced visual design.';

      systemInstruction = `You are "AI Radahn", the lead AI release architect and executive copywriter for Automatix (a premium B2B workflow automation and cloud integration platform).
Your task is to generate a feature announcement broadcast email based on the selected Git commits / Vercel deployments.

GUIDELINES:
1. Tone: ${tone === 'security_compliance' ? 'Urgent, compliance-focused, security-first' : tone === 'performance_update' ? 'High-performance engineering, speed, resilience' : 'Exciting, executive, high-tech, and empowering'}.
2. Body Format: Clean, semantic, inbox-friendly HTML with:
   - <p> for introductory and concluding paragraphs.
   - <h3> with clear section titles (e.g. <h3>🚀 What's New:</h3> or <h3>⚡ Performance & Features:</h3>).
   - <ul> and <li> for feature bullet points, highlighting key concepts with <strong> and <em>.
   - You may incorporate personalization tokens: {{USER_NAME}}, {{USER_EMAIL}}, {{SUBSCRIPTION_TIER}}, {{STORAGE_TIER}}, {{EXPIRY_DATE}}, {{APP_URL}}.
3. Output format: Return ONLY a valid, parseable JSON object with keys:
   {
     "subject": "Captivating and professional email subject line",
     "body": "Clean semantic HTML string for the email body"
   }
No markdown backticks around the JSON. Raw JSON only.`;

      userPrompt = `Selected Deployments / Releases:\n${deploymentsText}\n\nAdditional Admin Notes:\n${customNotes || 'None provided'}`;

    } else if (mode === 'REFINE') {
      if (!instruction?.trim()) {
        return NextResponse.json({ error: 'Modification instruction is required.' }, { status: 400 });
      }

      systemInstruction = `You are "AI Radahn", the AI refinement engine for Automatix email broadcasts.
Your task is to modify the provided email Subject and HTML Body strictly according to the admin's instruction.

GUIDELINES:
1. Preserve existing structure, HTML formatting, and tokens ({{USER_NAME}}, etc.) unless explicitly instructed to change them.
2. Ensure the body remains clean semantic HTML (<p>, <h3>, <ul>, <li>, <strong>, <em>, <code>).
3. Output format: Return ONLY a valid, parseable JSON object with keys:
   {
     "subject": "Modified or enhanced email subject",
     "body": "Modified semantic HTML body"
   }
No markdown backticks around the JSON. Raw JSON only.`;

      userPrompt = `Current Email Subject:\n${subject || '(Empty)'}\n\nCurrent HTML Body:\n${body || '(Empty)'}\n\nAdmin Refinement Instruction:\n${instruction}`;

    } else {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const result = await model.generateContent(`${systemInstruction}\n\n${userPrompt}`);
    const text = result.response.text();

    let parsed;
    try {
      const cleanJson = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn('Direct JSON parse failed, extracting via regex:', parseErr);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    return NextResponse.json({
      success: true,
      subject: parsed.subject || subject,
      body: parsed.body || body
    });

  } catch (error) {
    console.error('AI Radahn Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate with AI Radahn' }, { status: 500 });
  }
}
