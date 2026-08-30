/**
 * Live BYOK API Key Validator for AI Radahn
 * Pings official provider validation endpoints to ensure credentials are active and authorized.
 */

export async function validateApiKey(provider = 'gemini', apiKey = '') {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
    return {
      isValid: false,
      error: 'API key is missing or improperly formatted.'
    };
  }

  const cleanKey = apiKey.trim();

  try {
    // 1. Google Gemini Live Check (Metadata endpoint - free & instant)
    if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        return {
          isValid: true,
          provider: 'Google Gemini',
          message: 'Gemini API Key verified and operational.'
        };
      }

      const errMsg = data?.error?.message || 'Google Gemini rejected the API key (401/403 Unauthorized).';
      return {
        isValid: false,
        error: errMsg
      };
    }

    // 2. OpenAI Live Check (Models list endpoint - free & instant)
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${cleanKey}`
        }
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        return {
          isValid: true,
          provider: 'OpenAI',
          message: 'OpenAI API Key verified and operational.'
        };
      }

      const errMsg = data?.error?.message || 'OpenAI rejected the API key (401 Unauthorized).';
      return {
        isValid: false,
        error: errMsg
      };
    }

    // 3. Anthropic Claude Live Check (1-token test prompt)
    if (provider === 'claude' || provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }]
        })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok || res.status === 429) {
        // 200 or 429 rate limit still means the key is valid authentication-wise
        return {
          isValid: true,
          provider: 'Anthropic Claude',
          message: 'Anthropic API Key verified and operational.'
        };
      }

      const errMsg = data?.error?.message || 'Anthropic rejected the API key (401 Unauthorized).';
      return {
        isValid: false,
        error: errMsg
      };
    }

    return {
      isValid: false,
      error: `Unsupported provider: ${provider}`
    };
  } catch (err) {
    return {
      isValid: false,
      error: `Network error verifying ${provider} API key: ${err.message}`
    };
  }
}
