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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    const lowerLast = lastMessage.toLowerCase().trim();

    // Direct match for support ticket requests
    if (
      lowerLast.includes('raise a ticket') || 
      lowerLast.includes('create a ticket') || 
      lowerLast.includes('open a ticket') || 
      lowerLast.includes('support ticket') || 
      lowerLast.includes('contact support') ||
      lowerLast.includes('talk to human') ||
      lowerLast.includes('talk to admin') ||
      lowerLast.includes('raise ticket')
    ) {
      return NextResponse.json({
        success: true,
        message: 'I can help you open a formal support ticket with our engineering and administrative team right away. Click the button below to go directly to the Support Desk. [ACTION:RAISE_TICKET]'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        message: 'I am here to assist with workflows, connections, and storage quotas. If you need human assistance, feel free to open a support ticket. [ACTION:RAISE_TICKET]'
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const systemInstruction = `You are the friendly, helpful knowledgebase assistant for 'Automatix'.
You help users understand the platform. Here is the core knowledge you possess:

1. **Automatix Workflows**: The core engine. Workflows consist of Triggers (events that start the workflow, like "Incoming Webhook" or "New Email") and Actions (things that happen next, like "Send Slack Message" or "Create Database Row").
2. **Connections**: Users must connect their third-party accounts (like Slack, Google Drive, Calendly) in the 'Connections' tab before using them in Actions.
3. **Automatix Storage**: Our built-in media bucket for users. Users can upload images, videos, and documents (.pdf, .csv, .xlsx, .docx, .pptx) here to use in their workflows. 
4. **Storage Limits**: By default, users get a basic quota (e.g., 10 images, 1 video, 10 docs, 50MB total). If a user hits a limit, they can click "Upgrade Storage Quota" in the Storage Bucket UI to request a Quota Upgrade from the admin.
5. **Automatix Calendar**: A built-in scheduling tool for managing events and workflow triggers based on dates.

**IMPORTANT INSTRUCTIONS:**
- Keep your answers concise, helpful, and formatted with markdown when necessary. Never hallucinate features not mentioned here.
- Do NOT use emojis anywhere in your response.
- If a user asks a complex question, or if you feel they might need human assistance, ask them if they would like to raise a support ticket.
- If the user explicitly asks to raise a ticket, contact support, or says your answer wasn't helpful, output exactly this token at the very end of your message: [ACTION:RAISE_TICKET]`;

      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction
      });
      
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage);
      const text = result.response.text();

      return NextResponse.json({ success: true, message: text });
    } catch (aiError) {
      console.warn('Gemini API call failed, falling back to intelligent assistant response:', aiError);
      return NextResponse.json({
        success: true,
        message: 'I am ready to help you with workflows, triggers, calendar events, or storage questions. If you are experiencing a technical issue, please open a support ticket so our team can investigate directly. [ACTION:RAISE_TICKET]'
      });
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({
      success: true,
      message: 'Need help? You can contact our team directly through the Support Desk. [ACTION:RAISE_TICKET]'
    });
  }
}
