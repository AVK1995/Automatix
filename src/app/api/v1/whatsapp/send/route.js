import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('x-api-key') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: Missing Authorization header. Pass your WhatsApp Connection API Key as Bearer token.'
      }, { status: 401 });
    }

    // Find integration matching this token (by connection id or apiKey)
    const connection = await prisma.integration.findFirst({
      where: {
        providerName: 'whatsapp',
        OR: [
          { id: token },
          { apiKey: token }
        ]
      }
    });

    if (!connection) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Invalid WhatsApp Connection API Key.'
      }, { status: 403 });
    }

    const body = await req.json();
    const { to, templateName, language = 'en_US', variables = {}, headerMediaUrl } = body;

    if (!to || !templateName) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request: "to" (phone number) and "templateName" are required fields.'
      }, { status: 400 });
    }

    // Clean recipient phone (keep numbers only, e.g. 15551234567)
    const cleanTo = String(to).replace(/[^0-9]/g, '');
    if (cleanTo.length < 7) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request: "to" must be a valid E.164 phone number with country code.'
      }, { status: 400 });
    }

    const phoneId = connection.privateKey;
    const metaAccessToken = connection.apiKey;

    if (!phoneId || !metaAccessToken) {
      return NextResponse.json({
        success: false,
        error: 'Internal Configuration Error: Connection is missing Phone Number ID or Meta Access Token.'
      }, { status: 500 });
    }

    // Build template components for Meta API
    const components = [];

    // Header media if provided
    if (headerMediaUrl && typeof headerMediaUrl === 'string' && headerMediaUrl.trim()) {
      const lower = headerMediaUrl.toLowerCase();
      let mediaType = 'image';
      if (lower.match(/\.(mp4|mov|avi|webm)$/)) mediaType = 'video';
      else if (lower.match(/\.(pdf|doc|docx|csv|xlsx)$/)) mediaType = 'document';

      components.push({
        type: 'header',
        parameters: [
          {
            type: mediaType,
            [mediaType]: { link: headerMediaUrl.trim() }
          }
        ]
      });
    }

    // Body variables
    if (variables && typeof variables === 'object') {
      const bodyParams = Object.keys(variables)
        .sort((a, b) => Number(a) - Number(b))
        .map(key => ({
          type: 'text',
          text: String(variables[key] ?? '')
        }));

      if (bodyParams.length > 0) {
        components.push({
          type: 'body',
          parameters: bodyParams
        });
      }
    }

    // Call Meta Cloud API
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${metaAccessToken}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: components.length > 0 ? components : undefined
        }
      })
    });

    const metaData = await metaRes.json();

    // Mask phone for privacy compliance (e.g. "+91*****4321")
    const maskedPhone = cleanTo.length > 4 
      ? `+${cleanTo.slice(0, 2)}*****${cleanTo.slice(-4)}` 
      : `*****${cleanTo.slice(-2)}`;

    if (!metaRes.ok || metaData.error) {
      const errMsg = metaData.error?.message || 'Meta Cloud API message send failed';
      
      // Log failure
      await prisma.whatsAppLog.create({
        data: {
          integrationId: connection.id,
          clientId: connection.clientId,
          templateName,
          recipientPhoneMasked: maskedPhone,
          status: 'FAILED',
          errorMessage: errMsg,
          source: 'PUBLIC_API'
        }
      });

      return NextResponse.json({
        success: false,
        error: errMsg,
        metaError: metaData.error
      }, { status: 400 });
    }

    const messageId = metaData.messages?.[0]?.id || null;

    // Log success
    await prisma.whatsAppLog.create({
      data: {
        integrationId: connection.id,
        clientId: connection.clientId,
        templateName,
        recipientPhoneMasked: maskedPhone,
        status: 'SENT',
        metaMessageId: messageId,
        source: 'PUBLIC_API'
      }
    });

    return NextResponse.json({
      success: true,
      messageId,
      recipient: maskedPhone,
      template: templateName,
      status: 'SENT'
    });
  } catch (err) {
    console.error('[Public API /api/v1/whatsapp/send] Error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
