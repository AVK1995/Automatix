/**
 * Centralized Node Validation & Connection Status Engine for Automatix
 * Ensures consistent badge indicators (Connected, Missing Connection, Configured, Needs Config)
 * and publish/execution validation across the entire application.
 */

export function getNodeConnectionStatus(node) {
  if (!node || !node.integration) {
    return { needsConnection: false, isConnected: false };
  }

  const integrationId = node.integration.id;
  const config = node.config || {};

  // Integrations that strictly require an OAuth / Connected Account
  const oauthIntegrations = [
    'instagram',
    'instagram_action',
    'instagram_publish',
    'slack',
    'twilio',
    'whatsapp_template',
    'stripe',
    'gmail',
    'openai',
    'calendly',
    'calcom'
  ];

  if (oauthIntegrations.includes(integrationId)) {
    return {
      needsConnection: true,
      isConnected: !!config.connectionId
    };
  }

  // Google Sheets Action
  if (integrationId === 'sheets') {
    return {
      needsConnection: true,
      isConnected: !!(config.connectionId || config.spreadsheetId)
    };
  }

  // Email (Only if SMTP provider is selected)
  if (integrationId === 'email' && config.provider === 'smtp') {
    return {
      needsConnection: true,
      isConnected: !!config.connectionId
    };
  }

  // Calendar Trigger
  if (integrationId === 'calendar') {
    const provider = config.provider || 'builtin';
    if (provider !== 'builtin') {
      return {
        needsConnection: true,
        isConnected: !!config.connectionId
      };
    }
    return { needsConnection: false, isConnected: false };
  }

  return { needsConnection: false, isConnected: false };
}

export function isNodeConfigured(node, isInvalid = false, allNodes = []) {
  if (!node) return false;
  if (isInvalid || node.issue) return false;

  const id = node.integration?.id || node.type;
  const config = node.config || {};

  // 1. Trigger Nodes
  if (id === 'webhook') {
    return !!config.webhookToken;
  }

  if (id === 'storage_trigger') {
    const hasFolder = !!(config.folderName?.trim() || config.folderId?.trim() || config.provider);
    return !!config.webhookToken && hasFolder;
  }

  if (id === 'sheets_trigger') {
    const hasSheet = !!(config.spreadsheetId?.trim() || config.spreadsheetName?.trim());
    return !!config.webhookToken && hasSheet;
  }

  if (id === 'schedule') {
    return !!(config.cron?.trim() || config.interval || config.scheduleType || config.time);
  }

  if (id === 'stripe') {
    return !!(config.connectionId || config.event || config.eventType);
  }

  if (id === 'calendar') {
    const provider = config.provider || 'builtin';
    if (provider === 'builtin') {
      return !!(config.calendarId || config.connectionId || config.calendarName);
    }
    return !!config.connectionId;
  }

  if (id === 'instagram') {
    if (!config.connectionId) return false;
    if (config.condition === 'keyword' || config.condition === 'exact') {
      return !!config.keyword?.trim();
    }
    return true;
  }

  // 2. Action Nodes
  if (id === 'ai_mediator') {
    const provider = config.provider || 'gemini';
    const usesVault = provider === 'native' || provider === 'automatix' || provider.startsWith('vault_');
    if (!usesVault && !config.apiKey?.trim()) return false;

    if (config.provider === 'custom') {
      if (!config.baseUrl?.trim() || !config.customModel?.trim()) return false;
    }

    const hasTaskOrInput = !!(config.task?.trim() || config.mediaUrl?.trim() || config.customPrompt?.trim());
    return hasTaskOrInput;
  }

  if (id === 'instagram_publish') {
    const hasAccount = !!config.connectionId;
    const hasMedia = !!config.mediaUrl?.trim();
    return hasAccount && hasMedia;
  }

  if (id === 'instagram_action') {
    if (!config.connectionId) return false;
    if (config.messageType === 'media') {
      return !!config.mediaUrl?.trim();
    }
    return !!config.message?.trim();
  }

  if (id === 'slack') {
    return !!config.connectionId && !!config.channel?.trim() && !!config.message?.trim();
  }

  if (id === 'twilio') {
    return !!config.connectionId && !!config.to?.trim() && !!config.message?.trim();
  }

  if (id === 'whatsapp_template') {
    const hasConnection = !!config.connectionId;
    const hasTo = !!(config.toPhone?.trim() || config.to?.trim());
    const hasTemplate = !!config.templateName?.trim();
    return hasConnection && hasTo && hasTemplate;
  }

  if (id === 'email') {
    const hasTo = !!config.to?.trim();
    const hasContent = !!(config.subject?.trim() || config.body?.trim() || config.message?.trim());
    if (!hasTo || !hasContent) return false;
    if (config.provider === 'smtp' && !config.connectionId) return false;
    return true;
  }

  if (id === 'sheets') {
    const hasAuth = !!(config.connectionId || config.spreadsheetId);
    const hasTarget = !!(config.sheetName?.trim() || config.range?.trim() || config.rowValues || config.columnData);
    return hasAuth && hasTarget;
  }

  if (id === 'formatter_text') {
    const hasInput = config.input !== undefined && config.input !== null && String(config.input).trim() !== '';
    if (!hasInput) return false;
    if (config.operation === 'replace') {
      return config.find !== undefined && config.find !== null && String(config.find) !== '';
    }
    return !!config.operation;
  }

  if (id === 'formatter_math') {
    const hasInput = (config.valA !== undefined && config.valA !== '') || 
                     (config.amount !== undefined && config.amount !== '') || 
                     (config.input1 !== undefined && config.input1 !== '');
    return hasInput && !!(config.operation || 'add');
  }

  if (id === 'formatter_extract') {
    return !!(config.source?.trim() || config.inputString?.trim() || config.input?.trim());
  }

  if (id === 'formatter_dev') {
    return !!config.code?.trim();
  }

  if (id === 'date_formatter') {
    if (config.operation === 'duration') {
      return !!(config.startDate?.trim() && config.endDate?.trim());
    }
    return !!config.dateString?.trim();
  }

  if (id === 'custom_variable') {
    if (!config.varName?.trim()) return false;
    if (config.varType === 'timestamp' && config.useCurrentTime !== false) return true;
    return config.varValue !== undefined && config.varValue !== null && String(config.varValue).trim() !== '';
  }

  if (id === 'calendar_status') {
    return !!config.bookingId?.trim();
  }

  if (id === 'http') {
    return !!config.url?.trim() && !!config.method;
  }

  if (id === 'meta_capi') {
    return !!config.pixelId?.trim() && !!config.eventName?.trim();
  }

  // 3. Logic & Sequences
  if (id === 'delay') {
    const delayType = config.delayType || 'duration';
    if (delayType === 'until') {
      return !!config.untilDate?.trim();
    }
    if (delayType === 'event_based') {
      return !!config.eventDate?.trim() && config.duration !== undefined && config.duration !== '';
    }
    if (delayType === 'wait_for_reply') {
      return config.duration !== undefined && config.duration !== '';
    }
    return config.duration !== undefined && config.duration !== '';
  }

  if (id === 'condition') {
    const branches = config.branches || [{ id: 'A' }];
    if (!branches.length) return false;
    return branches.every(b => {
      const v = config[`path${b.id}Var`] || config[`path_${b.id}_var`];
      if (!v || String(v).trim() === '') return false;
      const op = config[`path${b.id}Op`] || config[`path_${b.id}_op`] || 'contains';
      if (op === 'exists' || op === 'not_exists') return true;
      const val = config[`path${b.id}Val`] || config[`path_${b.id}_val`];
      return val !== undefined && val !== null && String(val).trim() !== '';
    });
  }

  if (id === 'filter') {
    const varVal = config.variable || config.pathAVar || config.field;
    const op = config.operation || config.pathAOp || config.operator;
    return !!(varVal && String(varVal).trim() !== '') && !!op;
  }

  if (id === 'reminder_sequence') {
    const branches = config.branches || [{ id: '1', name: 'Reminder 1', color: 'purple-500' }];
    if (!branches.length) return false;

    // If canvas node has children populated
    if (node.children && node.children.length > 0) {
      return branches.every(branch => (node.children || []).some(c => c.pathId === branch.id));
    }
    // If flat allNodes array is available
    if (Array.isArray(allNodes) && allNodes.length > 0) {
      return branches.every(branch => allNodes.some(c => c.parentId === node.id && c.pathId === branch.id));
    }
    return true;
  }

  // Generic fallback
  const configKeys = Object.keys(config).filter(k => k !== 'webhookToken' && config[k] !== '' && config[k] !== undefined && config[k] !== null);
  return configKeys.length > 0;
}
