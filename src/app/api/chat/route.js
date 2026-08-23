import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = `You are the friendly, helpful knowledgebase assistant for 'Automatix'.
You help users understand the platform. Here is the core knowledge you possess:

1. **Automatix Workflows**: The core engine. Workflows consist of Triggers (events that start the workflow, like "Incoming Webhook" or "New Email") and Actions (things that happen next, like "Send Slack Message" or "Create Database Row").
2. **Connections**: Users must connect their third-party accounts (like Slack, Google Drive, Calendly) in the 'Connections' tab before using them in Actions.
3. **Automatix Storage**: Our built-in media bucket for users. Users can upload images and videos here to use in their workflows. 
4. **Storage Limits**: By default, users get a basic quota (e.g., 5 videos, 25MB each, 1GB total). If a user hits a limit, they can click "Upgrade Storage Quota" in the Storage Bucket UI to request a Quota Upgrade from the admin. The admin will review and approve the request.
5. **Automatix Calendar**: A built-in scheduling tool for managing events and workflow triggers based on dates.

**IMPORTANT INSTRUCTIONS:**
- Keep your answers concise, helpful, and formatted with markdown when necessary. Never hallucinate features not mentioned here.
- If a user asks a complex question, or if you feel they might need human assistance, ALWAYS ask them: "Did this answer your question, or would you like to raise a support ticket?"
- If the user explicitly asks to raise a ticket, contact support, or says your answer wasn't helpful, you MUST output exactly this token at the very end of your message: [ACTION:RAISE_TICKET]`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction
    });
    
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({
      history: history
    });

    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();

    return NextResponse.json({ success: true, message: text });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to communicate with Assistant' }, { status: 500 });
  }
}
