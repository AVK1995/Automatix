import { prisma } from '@/lib/prisma';
import { 
  executeTemplateArchitect, 
  executeSmtpEmailDrafter, 
  executeSocialDrafter, 
  executeVisionPromptDrafter,
  executeAnnouncementArchitect,
  executeRefineArchitect
} from './brain';

/**
 * AI Radahn Server-Side Operations, Multi-Provider BYOK Engine & Credit Management
 */

export async function deductUserAiCredit(userId, cost = 1, operation = 'AI_RADAHN_OPERATION') {
  if (!userId) throw new Error('User ID is required');

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, aiCredits: true, subscriptionTier: true }
    });

    if (!user) return { success: true, creditsRemaining: 50 };

    const currentCredits = typeof user.aiCredits === 'number' ? user.aiCredits : 50;

    if (currentCredits < cost) {
      const error = new Error('INSUFFICIENT_CREDITS');
      error.code = 'INSUFFICIENT_CREDITS';
      error.creditsRemaining = currentCredits;
      error.subscriptionTier = user.subscriptionTier;
      throw error;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        aiCredits: { decrement: cost }
      },
      select: { id: true, aiCredits: true }
    });

    return {
      success: true,
      creditsRemaining: updatedUser.aiCredits,
      costDeducted: cost,
      operation
    };
  } catch (err) {
    if (err.code === 'INSUFFICIENT_CREDITS') throw err;
    console.warn('AI Credit deduction skipped due to DB state:', err.message);
    return { success: true, creditsRemaining: 50 };
  }
}

export async function getUserAiCredits(userId) {
  if (!userId) return { aiCredits: 0, subscriptionTier: 'free' };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCredits: true, subscriptionTier: true, aiRadahnProvider: true, aiRadahnEngineMode: true, aiRadahnApiKey: true }
    });

    return {
      aiCredits: typeof user?.aiCredits === 'number' ? user.aiCredits : 50,
      subscriptionTier: user?.subscriptionTier || 'free',
      hasApiKey: Boolean(user?.aiRadahnApiKey),
      engineMode: user?.aiRadahnEngineMode || 'native',
      provider: user?.aiRadahnProvider || 'gemini'
    };
  } catch (err) {
    return { aiCredits: 50, subscriptionTier: 'free', hasApiKey: false, engineMode: 'native', provider: 'gemini' };
  }
}

/**
 * Unified AI Radahn Inference Dispatcher with Multi-Provider BYOK & Ironclad Fallback
 */
export async function executeAiRadahnInference({
  userId,
  mode = 'TRANSACTIONAL_TEMPLATE',
  instruction = '',
  tone = 'modern_dark',
  currentTemplate = '',
  triggerData = {},
  previousSteps = [],
  customNotes = '',
  selectedDeployments = []
}) {
  let user = null;
  if (userId) {
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true, aiRadahnProvider: true, aiRadahnApiKey: true, aiRadahnEngineMode: true }
      });
    } catch (e) {
      console.warn('Could not read user AI preferences, falling back to env/native:', e.message);
    }
  }

  const rawEnvKey = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '').trim();
  const isPaid = user?.subscriptionTier && user.subscriptionTier.toLowerCase() !== 'free';
  const isByok = isPaid && user?.aiRadahnEngineMode === 'byok' && Boolean(user?.aiRadahnApiKey);
  
  const userApiKey = isByok 
    ? user.aiRadahnApiKey.replace(/['"]/g, '').trim() 
    : rawEnvKey;
    
  const provider = isByok 
    ? (user.aiRadahnProvider || 'gemini') 
    : (rawEnvKey ? 'gemini' : 'native');

  // 1. If BYOK or Admin Key is active, attempt true LLM reasoning
  if (userApiKey && provider !== 'native') {
    try {
      const llmResult = await executeLlmInference({
        provider,
        apiKey: userApiKey,
        mode,
        instruction,
        tone,
        currentTemplate,
        triggerData,
        previousSteps,
        customNotes,
        selectedDeployments
      });

      if (llmResult?.success && (llmResult.template || llmResult.body || llmResult.message)) {
        return {
          ...llmResult,
          engineUsed: `AI Radahn True AI Brain (${provider.toUpperCase()})`
        };
      }
    } catch (llmErr) {
      console.warn('AI Radahn LLM Inference failed, gracefully falling back to Native Core Brain:', llmErr.message);
    }
  }

  // 2. Ironclad Fallback to Built-in AI Radahn Core Brain
  try {
    if (mode === 'TRANSACTIONAL_TEMPLATE' || mode === 'TEMPLATE') {
      const res = executeTemplateArchitect({ instruction, tone, currentTemplate });
      return {
        success: true,
        template: res.template,
        body: res.template,
        engineUsed: 'AI Radahn Native Core Brain'
      };
    }

    if (mode === 'WORKFLOW_EMAIL' || mode === 'SMTP_EMAIL') {
      const res = executeSmtpEmailDrafter({ triggerData, previousSteps, userPrompt: instruction, brandTone: tone });
      return {
        success: true,
        subject: res.subject,
        htmlBody: res.htmlBody,
        variablesDetected: res.variablesDetected,
        engineUsed: 'AI Radahn Native Core Brain'
      };
    }

    if (mode === 'SOCIAL_MESSAGE') {
      const res = executeSocialDrafter({ platform: triggerData?.platform || 'INSTAGRAM_DM', context: triggerData || {}, userPrompt: instruction });
      return {
        success: true,
        message: res.message,
        engineUsed: 'AI Radahn Native Core Brain'
      };
    }

    if (mode === 'VISION_PROMPT') {
      const res = executeVisionPromptDrafter({ brandTone: tone, mediaType: triggerData?.mediaType || 'video', taskOperation: triggerData?.task || 'caption' });
      return {
        success: true,
        generatedInstruction: res.generatedInstruction,
        engineUsed: 'AI Radahn Native Core Brain'
      };
    }

    if (mode === 'ANNOUNCEMENT_FROM_DEPLOYMENTS') {
      const res = executeAnnouncementArchitect({ selectedDeployments, customNotes, tone });
      return {
        success: true,
        subject: res.subject,
        body: res.body,
        engineUsed: 'AI Radahn Native Core Brain'
      };
    }

    const refineRes = executeRefineArchitect({ instruction, subject: triggerData?.subject || '', body: currentTemplate });
    return {
      success: true,
      subject: refineRes.subject,
      body: refineRes.body,
      engineUsed: 'AI Radahn Native Core Brain'
    };
  } catch (fallbackErr) {
    console.error('Core brain execution error:', fallbackErr);
    // Absolute fallback: static safe email template
    return {
      success: true,
      template: `<!DOCTYPE html><html><body style="background:#0e0e0e;color:#fff;font-family:sans-serif;padding:32px;text-align:center;"><div style="max-width:540px;margin:0 auto;background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;"><h1 style="color:#fff;">Reset Your Password</h1><p style="color:#a1a1aa;">Click below to reset your Automatix password.</p><a href="{{SETUP_LINK}}" style="display:inline-block;background:#8B5CF6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:20px 0;">Reset Password</a></div></body></html>`,
      engineUsed: 'AI Radahn Emergency Fallback'
    };
  }
}

/**
 * Direct Multi-Provider LLM Calling Logic with Smart Output Extraction
 */
async function executeLlmInference({
  provider = 'gemini',
  apiKey = '',
  mode,
  instruction,
  tone,
  currentTemplate,
  triggerData,
  previousSteps,
  customNotes,
  selectedDeployments
}) {
  const cleanKey = apiKey.trim();
  if (!cleanKey) throw new Error('API Key is empty');

  const systemPrompt = `You are "AI Radahn", the world-class Lead UI/UX Designer, Senior Frontend Email Engineer, and Conversion Copywriter for Automatix.
Your task is to generate strict, clean, highly structured code or text output matching the requested utility.

CRITICAL RULES:
1. Logo: Include the official Automatix brand logo mark in email outputs (Silver metallic gradient 'A' SVG badge + Automatix typography).
2. Structure: Use table-based inline-styled responsive HTML containers (#0e0e0e background, max-width: 540px, rounded corners).
3. Tokens: In password reset emails, MUST include {{SETUP_LINK}} and can include {{USER_EMAIL}} and {{USER_NAME}}.
4. Negative Prompts: If user says "remove eyebrow" or "no badge", OMIT the eyebrow badge completely.
5. Tone & Theme: Dynamically match requested pop-culture, gaming, or brand aesthetics (e.g. GTA 6, Call of Duty Tactical Camo Lime #84CC16, Cyberpunk, Luxury Gold, Minimalist).
6. Output format: Return clean HTML or JSON with keys { "template": "<!DOCTYPE html>...", "subject": "..." }.`;

  const userPrompt = `Mode: ${mode}\nInstruction: ${instruction}\nTone: ${tone}\nExisting Template (if any): ${currentTemplate || '(None)'}\nContext: ${JSON.stringify(triggerData || {})}`;

  // A. GOOGLE GEMINI
  if (provider === 'gemini') {
    const candidateModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];

    let lastError = null;
    for (const modelName of candidateModels) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: {
              maxOutputTokens: 1800,
              temperature: 0.2
            }
          })
        });

        const data = await res.json();
        if (data.error?.message) {
          throw new Error(data.error.message);
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText.trim()) {
          const parsed = extractStructuredOutput(rawText);
          return {
            success: true,
            template: parsed.template || parsed.body || '',
            subject: parsed.subject || 'Automatix Notification',
            body: parsed.body || parsed.template || ''
          };
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Gemini generation yielded empty response');
  }

  // B. OPENAI (GPT-4o-mini / GPT-4o)
  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1800
      })
    });

    const data = await res.json();
    if (data.error?.message) throw new Error(data.error.message);

    const rawText = data.choices?.[0]?.message?.content || '';
    const parsed = extractStructuredOutput(rawText);
    return {
      success: true,
      template: parsed.template || parsed.body || '',
      subject: parsed.subject || 'Automatix Notification',
      body: parsed.body || parsed.template || ''
    };
  }

  // C. ANTHROPIC CLAUDE
  if (provider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 1800,
        temperature: 0.2
      })
    });

    const data = await res.json();
    if (data.error?.message) throw new Error(data.error.message);

    const rawText = data.content?.[0]?.text || '';
    const parsed = extractStructuredOutput(rawText);
    return {
      success: true,
      template: parsed.template || parsed.body || '',
      subject: parsed.subject || 'Automatix Notification',
      body: parsed.body || parsed.template || ''
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Intelligent JSON / HTML / Text Extractor from LLM raw output
 */
function extractStructuredOutput(rawText = '') {
  const text = rawText.trim();

  // 1. Try parsing JSON if wrapped in codeblocks or raw
  try {
    const cleanJson = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    const parsed = JSON.parse(cleanJson);
    if (parsed.template || parsed.body || parsed.htmlBody) {
      return {
        template: parsed.template || parsed.htmlBody || parsed.body || '',
        subject: parsed.subject || '',
        body: parsed.body || parsed.template || ''
      };
    }
  } catch {
    // Not valid JSON, proceed to HTML/text extraction
  }

  // 2. If the LLM returned raw HTML (starts with <!DOCTYPE or <html or <div)
  if (text.includes('<!DOCTYPE html>') || text.includes('<html') || (text.includes('<div') && text.includes('</div>'))) {
    const cleanHtml = text
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    return {
      template: cleanHtml,
      body: cleanHtml,
      subject: 'Automatix: Account & Security Notification'
    };
  }

  // 3. Fallback text output
  return {
    template: text,
    body: text,
    subject: 'Automatix Notification'
  };
}
