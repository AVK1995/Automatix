'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

/**
 * Get all active WhatsApp connections for the logged-in user
 */
export async function getWhatsAppConnections() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const connections = await prisma.integration.findMany({
      where: {
        clientId: session.user.id,
        providerName: 'whatsapp'
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, connections };
  } catch (err) {
    console.error('[getWhatsAppConnections] Error:', err);
    return { success: false, error: 'Failed to fetch WhatsApp connections.' };
  }
}

/**
 * Fetch WhatsApp templates from Meta Cloud API and sync with local DB
 */
export async function getWhatsAppTemplates(integrationId) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const connection = await prisma.integration.findUnique({
      where: { id: integrationId }
    });

    if (!connection || connection.clientId !== session.user.id) {
      return { success: false, error: 'WhatsApp connection not found.' };
    }

    const wabaId = connection.clientEmail; // WABA ID
    const accessToken = connection.apiKey;

    let metaTemplates = [];

    // If WABA ID is available, sync directly with Meta Cloud API
    if (wabaId && accessToken) {
      try {
        const res = await fetch(`https://graph.facebook.com/v21.0/${wabaId}/message_templates?fields=id,name,status,category,language,components,quality_score,rejected_reason&limit=100`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          next: { revalidate: 60 }
        });

        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          metaTemplates = data.data;

          // Upsert into local database
          for (const t of metaTemplates) {
            await prisma.whatsAppTemplate.upsert({
              where: {
                integrationId_templateName_language: {
                  integrationId: connection.id,
                  templateName: t.name,
                  language: t.language || 'en_US'
                }
              },
              update: {
                status: t.status || 'APPROVED',
                category: t.category || 'MARKETING',
                componentsJson: t.components || [],
                metaTemplateId: t.id || null,
                rejectionReason: t.rejected_reason || null
              },
              create: {
                integrationId: connection.id,
                clientId: session.user.id,
                templateName: t.name,
                category: t.category || 'MARKETING',
                language: t.language || 'en_US',
                status: t.status || 'APPROVED',
                componentsJson: t.components || [],
                metaTemplateId: t.id || null,
                rejectionReason: t.rejected_reason || null
              }
            });
          }
        }
      } catch (metaErr) {
        console.warn('[getWhatsAppTemplates] Meta fetch failed, falling back to DB:', metaErr);
      }
    }

    // Return stored templates from DB
    const templates = await prisma.whatsAppTemplate.findMany({
      where: { integrationId: connection.id },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, templates };
  } catch (err) {
    console.error('[getWhatsAppTemplates] Error:', err);
    return { success: false, error: 'Failed to retrieve WhatsApp templates.' };
  }
}

/**
 * Submit a newly crafted template directly to Meta Cloud API
 */
export async function createWhatsAppTemplate(integrationId, templatePayload) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const connection = await prisma.integration.findUnique({
      where: { id: integrationId }
    });

    if (!connection || connection.clientId !== session.user.id) {
      return { success: false, error: 'WhatsApp connection not found.' };
    }

    const wabaId = connection.clientEmail;
    const accessToken = connection.apiKey;

    if (!wabaId || !accessToken) {
      return { success: false, error: 'WABA ID or Access Token is missing from this connection.' };
    }

    const { name, category, language, components } = templatePayload;

    // Sanitize template name (Meta rule: lowercase, numbers, underscores only)
    const cleanName = (name || '').toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '');

    if (!cleanName) {
      return { success: false, error: 'Template name must contain only letters, numbers, and underscores.' };
    }

    // Call Meta API
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${wabaId}/message_templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: cleanName,
        category: category || 'MARKETING',
        language: language || 'en_US',
        components: components || []
      })
    });

    const metaData = await metaRes.json();

    if (metaData.error) {
      return {
        success: false,
        error: metaData.error.message || 'Meta rejected the template creation request.'
      };
    }

    // Save in local DB as PENDING or APPROVED
    const saved = await prisma.whatsAppTemplate.create({
      data: {
        integrationId: connection.id,
        clientId: session.user.id,
        templateName: cleanName,
        category: category || 'MARKETING',
        language: language || 'en_US',
        status: metaData.status || 'PENDING',
        componentsJson: components || [],
        metaTemplateId: metaData.id || null
      }
    });

    revalidatePath('/dashboard/whatsapp');
    return { success: true, template: saved };
  } catch (err) {
    console.error('[createWhatsAppTemplate] Error:', err);
    return { success: false, error: err.message || 'Failed to submit template to Meta.' };
  }
}

/**
 * Delete template from Meta and local DB
 */
export async function deleteWhatsAppTemplate(templateId, templateName, integrationId) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const connection = await prisma.integration.findUnique({
      where: { id: integrationId }
    });

    if (!connection || connection.clientId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const wabaId = connection.clientEmail;
    const accessToken = connection.apiKey;

    if (wabaId && accessToken && templateName) {
      try {
        await fetch(`https://graph.facebook.com/v21.0/${wabaId}/message_templates?name=${encodeURIComponent(templateName)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } catch (e) {
        console.warn('Meta delete warning:', e);
      }
    }

    await prisma.whatsAppTemplate.delete({
      where: { id: templateId }
    });

    revalidatePath('/dashboard/whatsapp');
    return { success: true };
  } catch (err) {
    console.error('[deleteWhatsAppTemplate] Error:', err);
    return { success: false, error: 'Failed to delete template.' };
  }
}

/**
 * Get account quality health rating, tier, and 30-day volume metrics
 */
export async function getWhatsAppAccountStats(integrationId) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const connection = await prisma.integration.findUnique({
      where: { id: integrationId }
    });

    if (!connection || connection.clientId !== session.user.id) {
      return { success: false, error: 'Connection not found.' };
    }

    const phoneId = connection.privateKey;
    const accessToken = connection.apiKey;

    let liveInfo = {
      displayPhone: connection.accountEmail,
      qualityRating: 'GREEN',
      tier: 'TIER_1K',
      verifiedName: connection.name
    };

    if (phoneId && accessToken) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier&access_token=${accessToken}`);
        const metaData = await metaRes.json();
        if (!metaData.error) {
          liveInfo = {
            displayPhone: metaData.display_phone_number || connection.accountEmail,
            qualityRating: metaData.quality_rating || 'GREEN',
            tier: metaData.messaging_limit_tier || 'TIER_1K',
            verifiedName: metaData.verified_name || connection.name
          };
        }
      } catch (e) {
        console.warn('Could not fetch live Meta quality stats:', e);
      }
    }

    // Calculate 30-day message metrics from WhatsAppLog
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logs = await prisma.whatsAppLog.findMany({
      where: {
        integrationId: connection.id,
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { status: true, source: true }
    });

    const totalSent = logs.length;
    const delivered = logs.filter(l => l.status === 'DELIVERED' || l.status === 'READ').length;
    const read = logs.filter(l => l.status === 'READ').length;
    const failed = logs.filter(l => l.status === 'FAILED').length;

    return {
      success: true,
      stats: {
        ...liveInfo,
        totalSent,
        delivered,
        read,
        failed,
        deliveryRate: totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 100
      }
    };
  } catch (err) {
    console.error('[getWhatsAppAccountStats] Error:', err);
    return { success: false, error: 'Failed to fetch account stats.' };
  }
}
