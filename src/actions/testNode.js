'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import fs from 'fs';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';
import { checkAndLogUsage } from '@/actions/rateLimit';
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/encryption';
import { SYSTEM_LIMITS } from '@/lib/limits';
import { cleanValueForSheets } from '@/lib/dateUtils';
import { getGoogleAccessToken } from '@/lib/googleAuth';
import { executeGoogleSheetsAction } from '@/lib/sheetsExecutor';
import { buildAiPrompt, generateAiContent, verifyApiKey, parseStructuredAiResponse } from '@/lib/aiProvider';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Helper to replace {{variables}} with dummy data for testing
const applyTestVariables = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{([^}]+)\}\}/g, 'test_$1_value');
};

export async function testNodeAction(node) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized', fix: 'Please log in again.' };

  const { type, integration, config } = node;
  const integrationId = integration?.id || node.integrationId;

  if (!config) {
    return { success: false, error: 'Missing configuration', fix: 'Please fill out the configuration fields.' };
  }

  try {
    // Determine the integration ID to use for quota tracking
    const trackingId = config.connectionId;
    if (trackingId) {
      await checkAndLogUsage(trackingId, session.user.quotaTier || 'free');
    }

    switch (integrationId) {
      case 'http':
        return await executeHttpTest(config);
      
      case 'meta_capi':
        return await executeMetaCapiTest(config, session.user.id);

      case 'sheets':
        return await executeSheetsTest(config, session.user.id);
      
      case 'email':
        return await executeEmailTest(config, session.user.id);

      case 'calendar_status':
        return await executeCalendarStatusTest(config);

      case 'delay':
        return await executeDelayTest(config);
      
      case 'instagram_action':
      case 'interactive_prompt':
        return await executeInstagramActionTest(config, session.user.id);
        
      case 'condition':
        return await executeConditionTest(config);

      case 'slack':
      case 'twilio':
        return { 
          success: true, 
          data: { message: `Simulated success for ${integrationId}. Real execution engine for this provider is coming soon.` } 
        };

      case 'ai_mediator':
        return await executeAiMediatorTest(config);

      case 'instagram_publish':
        return await executeInstagramPublishTest(config, session.user.id);

      case 'formatter_text':
        return await executeTextFormatterTest(config);

      case 'formatter_math':
        return await executeMathFormatterTest(config);

      case 'date_formatter':
        return await executeDateFormatterTest(config);

      case 'custom_variable':
        return await executeCustomVariableTest(config);

      case 'code':
        return await executeCodeTest(config);

      default:
        return { success: false, error: 'Unsupported integration type for testing', fix: 'This step type cannot be tested yet.' };
    }
  } catch (err) {
    console.error(`[testNodeAction] Error executing ${integrationId}:`, err);
    return { 
      success: false, 
      error: err.message || 'Unknown execution error',
      fix: 'Check the server logs or ensure your configuration parameters are completely valid.'
    };
  }
}

async function executeConditionTest(config) {
  const branches = config?.branches || [];
  
  for (const branch of branches) {
      const varTmpl = config[`path${branch.id}Var`];
      const op = config[`path${branch.id}Op`] || 'contains';
      const valTmpl = config[`path${branch.id}Val`];
      
      if (!varTmpl) continue;
      
      const actualVar = applyTestVariables(varTmpl);
      
      if (op === 'exists') {
        if (actualVar !== undefined && actualVar !== null && actualVar !== '') return { success: true, data: { result: `Would route to Path ${branch.id}`, evaluated_variable: actualVar }};
        continue;
      }
      if (op === 'not_exists') {
        if (actualVar === undefined || actualVar === null || actualVar === '') return { success: true, data: { result: `Would route to Path ${branch.id}`, evaluated_variable: actualVar }};
        continue;
      }
      
      const valStr = applyTestVariables(valTmpl) || '';
      const isCaseSensitive = config[`path${branch.id}Case`] === true;
      const possibleVals = valStr.split(',').map(s => s.trim());
      const varString = String(actualVar);
      
      let matched = false;
      for (const v of possibleVals) {
         const andParts = v.split('&&').map(s => s.trim());
         let allAndsMatch = true;
         
         for (const part of andParts) {
            const p = isCaseSensitive ? part : part.toLowerCase();
            const a = isCaseSensitive ? varString : varString.toLowerCase();
            
            let partMatched = false;
            if (op === 'contains' && a.includes(p)) partMatched = true;
            if (op === 'not_contains' && !a.includes(p)) partMatched = true;
            if (op === 'equals' && a === p) partMatched = true;
            if (op === 'not_equals' && a !== p) partMatched = true;
            if (op === 'starts_with' && a.startsWith(p)) partMatched = true;
            if (op === 'ends_with' && a.endsWith(p)) partMatched = true;
            if (op === 'greater_than' && Number(actualVar) > Number(part)) partMatched = true;
            if (op === 'less_than' && Number(actualVar) < Number(part)) partMatched = true;
            
            if (!partMatched) {
               allAndsMatch = false;
               break;
            }
         }
         
         if (allAndsMatch) {
            matched = true;
            break;
         }
      }
      
      if (matched) {
         return { success: true, data: { result: `Would route to Path ${branch.id}`, evaluated_variable: actualVar }};
      }
  }
  return { success: true, data: { result: `Would route to Fallback (ELSE) path` }};
}

async function executeCustomVariableTest(config) {
  const { varType, varValue, useCurrentTime, varFormat, varTimezone } = config;
  
  if (varType === 'timestamp') {
    const tz = varTimezone || 'UTC';
    
    // Replace 'TZ' with a dayjs literal of the timezone so dayjs doesn't parse 'Z' as offset
    const userFormat = varFormat || 'YYYY-MM-DD HH:mm:ss';
    const processedFormat = userFormat.replace(/\bTZ\b/g, `[${tz}]`);

    if (useCurrentTime !== false) {
      // Current time
      const now = dayjs().tz(tz);
      const outputStr = now.format(processedFormat);
      return { success: true, data: { output: outputStr } };
    } else {
      // Custom time
      if (!varValue) throw new Error("Custom Date/Time value is required.");
      const resolvedValue = applyTestVariables(varValue);
      const parsed = dayjs.tz(resolvedValue, tz);
      if (!parsed.isValid()) throw new Error(`Invalid date format provided: ${resolvedValue}`);
      const outputStr = parsed.format(processedFormat);
      return { success: true, data: { output: outputStr } };
    }
  }

  // Text or Number
  let resolvedValue = varValue ? applyTestVariables(varValue) : '';
  if (varType === 'number') {
    const num = Number(resolvedValue);
    if (isNaN(num)) throw new Error(`Value "${resolvedValue}" is not a valid number.`);
    resolvedValue = num;
  }
  
  return { success: true, data: { output: resolvedValue } };
}

async function executeTextFormatterTest(config) {
  const { input, operation, find, replace, separator, index, defaultValue, matchBefore, matchAfter, maxLength, appendEllipsis } = config;
  
  // For default_value, input can be empty. For others, it's usually required, but let's safely handle it.
  let rawInput = input ? applyTestVariables(input) : '';
  if (typeof rawInput !== 'string') rawInput = String(rawInput);

  let result = rawInput;
  try {
    switch (operation) {
      case 'default_value':
        if (!rawInput.trim()) {
          result = applyTestVariables(defaultValue || '');
        }
        break;
      case 'find':
        const searchStr = applyTestVariables(find || '');
        const findIndex = rawInput.indexOf(searchStr);
        result = {
          found: findIndex !== -1,
          index: findIndex !== -1 ? findIndex : null,
          matchedText: findIndex !== -1 ? searchStr : null
        };
        break;
      case 'parse':
        let parsedResult = rawInput;
        const b = applyTestVariables(matchBefore || '');
        const a = applyTestVariables(matchAfter || '');
        if (a) {
          const aIndex = parsedResult.indexOf(a);
          if (aIndex !== -1) parsedResult = parsedResult.substring(aIndex + a.length);
        }
        if (b) {
          const bIndex = parsedResult.indexOf(b);
          if (bIndex !== -1) parsedResult = parsedResult.substring(0, bIndex);
        }
        result = parsedResult.trim();
        break;
      case 'truncate':
        const len = parseInt(maxLength, 10) || 50;
        if (rawInput.length > len) {
          result = rawInput.substring(0, len) + (appendEllipsis !== false ? '...' : '');
        }
        break;
      case 'html_to_markdown':
        // A very basic HTML to Markdown converter for simple tags
        result = rawInput
          .replace(/<h[1-6]>(.*?)<\/h[1-6]>/gi, '# $1\n')
          .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
          .replace(/<b>(.*?)<\/b>/gi, '**$1**')
          .replace(/<em>(.*?)<\/em>/gi, '*$1*')
          .replace(/<i>(.*?)<\/i>/gi, '*$1*')
          .replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
          .replace(/<[^>]*>?/gm, ''); // Strip remaining tags
        result = result.trim();
        break;
      case 'capitalize':
        result = rawInput.replace(/\b\w/g, c => c.toUpperCase());
        break;
      case 'lowercase':
        result = rawInput.toLowerCase();
        break;
      case 'uppercase':
        result = rawInput.toUpperCase();
        break;
      case 'extract_data':
        try {
          const type = config.extractType || 'email';
          if (type === 'email') {
            const match = rawInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            result = match ? match[0] : null;
          } else if (type === 'phone') {
            const match = rawInput.match(/(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\d{2,4}[\s-]?){2,4}\d{2,4}/);
            result = match ? match[0] : null;
          } else if (type === 'url') {
            const match = rawInput.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/);
            result = match ? match[0] : null;
          } else if (type === 'number') {
            const match = rawInput.match(/\d+/);
            result = match ? match[0] : null;
          } else if (type === 'name') {
            const match = rawInput.match(/(?:my name is|i am|i'm|this is|it is|it's|call me|name is)\s+([a-zA-Z]+)/i);
            if (match && match[1]) {
              result = match[1];
            } else {
              // If no common prefix is found, just take the first word, or return the whole thing if it's short.
              if (rawInput.split(' ').length <= 2) {
                result = rawInput.trim();
              } else {
                result = rawInput; // "take answer as it is"
              }
            }
          }
        } catch (e) {
          result = null;
        }
        break;
      case 'replace':
        const findVal = applyTestVariables(find || '');
        const replaceVal = applyTestVariables(replace || '');
        // Replace all occurrences using global regex if it's a simple string
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = rawInput.replace(new RegExp(escapeRegExp(findVal), 'g'), replaceVal);
        break;
      case 'split':
        let sep = separator || ',';
        if (sep === '{{space}}') sep = ' ';
        const parts = rawInput.split(sep);
        if (index !== undefined && index !== '') {
          const idx = parseInt(index, 10);
          if (!isNaN(idx)) {
            if (idx >= 0 && idx < parts.length) result = parts[idx].trim();
            else if (idx < 0 && parts.length + idx >= 0) result = parts[parts.length + idx].trim();
            else result = null;
          } else {
            result = parts.map(p => p.trim());
          }
        } else {
          result = parts.map(p => p.trim());
        }
        break;
      case 'length':
        result = rawInput.length;
        break;
      case 'remove_html':
        result = rawInput.replace(/<[^>]*>?/gm, '');
        break;
      case 'encode_uri':
        result = encodeURIComponent(rawInput);
        break;
      case 'decode_uri':
        result = decodeURIComponent(rawInput);
        break;
    }
  } catch (e) {
    return { success: false, error: e.message };
  }

  return {
    success: true,
    data: {
      original: rawInput,
      result: result
    }
  };
}

async function executeMathFormatterTest(config) {
  const { operation, valA, valB, amount, currency, decimals, countryCode, step } = config;

  let result;
  try {
    switch (operation) {
      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide':
        const a = parseFloat(applyTestVariables(valA || '0'));
        const b = parseFloat(applyTestVariables(valB || '0'));
        if (isNaN(a) || isNaN(b)) throw new Error('Invalid number provided for math operation');
        if (operation === 'add') result = a + b;
        if (operation === 'subtract') result = a - b;
        if (operation === 'multiply') result = a * b;
        if (operation === 'divide') {
          if (b === 0) throw new Error('Division by zero is not allowed');
          result = a / b;
        }
        break;
      case 'format_currency':
        const amt = parseFloat(applyTestVariables(amount || '0'));
        if (isNaN(amt)) throw new Error('Invalid amount');
        const cc = applyTestVariables(currency || 'USD').toUpperCase();
        result = new Intl.NumberFormat('en-US', { style: 'currency', currency: cc }).format(amt);
        break;
      case 'format_number':
        const numAmt = parseFloat(applyTestVariables(amount || '0'));
        if (isNaN(numAmt)) throw new Error('Invalid amount');
        const d = parseInt(decimals, 10);
        const options = {};
        if (!isNaN(d)) {
          options.minimumFractionDigits = d;
          options.maximumFractionDigits = d;
        }
        result = new Intl.NumberFormat('en-US', options).format(numAmt);
        break;
      case 'format_phone':
        // A simple generic formatter. For deep formatting, a library like google-libphonenumber is better.
        let phone = applyTestVariables(amount || '').replace(/\D/g, '');
        const cCode = applyTestVariables(countryCode || '').replace(/\D/g, '');
        if (cCode && !phone.startsWith(cCode)) {
          phone = cCode + phone;
        }
        result = `+${phone}`;
        break;
      case 'counter':
        const base = parseFloat(applyTestVariables(amount || '0'));
        const stepVal = parseFloat(applyTestVariables(step || '1'));
        if (isNaN(base) || isNaN(stepVal)) throw new Error('Invalid base or step value');
        result = base + stepVal;
        break;
      default:
        throw new Error('Unknown math operation');
    }
  } catch (e) {
    return { success: false, error: e.message };
  }

  return {
    success: true,
    data: {
      result: result
    }
  };
}

async function executeDateFormatterTest(config) {
  const op = config.operation || 'format_timezone';

  if (op === 'duration') {
    const startStr = applyTestVariables(config.startDate);
    const endStr = applyTestVariables(config.endDate);
    const unit = config.durationUnit || 'days';
    
    const startObj = dayjs.utc(startStr);
    const endObj = dayjs.utc(endStr);
    
    if (!startObj.isValid()) return { success: false, error: 'Invalid Start Date', fix: `Could not parse: ${startStr}` };
    if (!endObj.isValid()) return { success: false, error: 'Invalid End Date', fix: `Could not parse: ${endStr}` };
    
    const diff = endObj.diff(startObj, unit);
    return { success: true, data: { result: diff } };
  }

  // Both format_timezone and add_subtract need the base date parsed
  const { dateString, sourceTz, targetTz, outputFormat, mathAction, mathAmount, mathUnit } = config;
  const rawDate = applyTestVariables(dateString);
  
  try {
    let dateObj;
    const sTz = sourceTz || 'UTC';
    dateObj = dayjs.tz(rawDate, sTz);
    
    if (!dateObj.isValid()) {
       if (/^\d{10}$/.test(rawDate)) {
         dateObj = dayjs.unix(Number(rawDate));
       } else if (/^\d{13}$/.test(rawDate)) {
         dateObj = dayjs(Number(rawDate));
       } else {
         return { success: false, error: 'Invalid Date String', fix: 'The provided date string could not be parsed.' };
       }
    }

    if (op === 'add_subtract') {
      const expr = applyTestVariables(config.mathExpression || '').trim().toLowerCase();
      if (expr) {
        let sign = 1;
        let workStr = expr;
        if (workStr.startsWith('+')) {
          sign = 1;
          workStr = workStr.substring(1).trim();
        } else if (workStr.startsWith('-')) {
          sign = -1;
          workStr = workStr.substring(1).trim();
        }

        const parts = workStr.split(/\s+/);
        for (let i = 0; i < parts.length; i += 2) {
          const amount = Number(parts[i]);
          let unit = parts[i+1];
          if (!isNaN(amount) && unit) {
            if (!unit.endsWith('s')) unit += 's'; // day -> days
            if (sign === 1) {
              dateObj = dateObj.add(amount, unit);
            } else {
              dateObj = dateObj.subtract(amount, unit);
            }
          }
        }
      }
    }
    
    const tTz = targetTz || 'UTC';
    let targetObj = dateObj.tz(tTz);
    
    let resultStr = '';
    const formatStr = outputFormat || 'YYYY-MM-DD';
    
    if (formatStr === 'X') {
      resultStr = targetObj.unix();
    } else if (formatStr === 'x') {
      resultStr = targetObj.valueOf();
    } else {
      const finalFormat = formatStr.replace(/TZ/g, `[${tTz}]`);
      resultStr = targetObj.format(finalFormat);
    }
    
    return { success: true, data: { result: resultStr } };
  } catch (err) {
    return { success: false, error: 'Date Formatting Error', fix: err.message };
  }
}

async function executeCodeTest(config) {
  if (!config.code) return { success: false, error: 'Missing Code', fix: 'Please write some JavaScript code.' };
  
  return {
    success: true,
    data: {
      result: 'simulated_code_output',
      status: 'success'
    }
  };
}

async function executeHttpTest(config) {
  if (!config.url) return { success: false, error: 'Missing URL', fix: 'Please enter a valid URL.' };
  
  const url = applyTestVariables(config.url);
  const method = config.method || 'GET';
  const headers = {};
  
  if (config.headers) {
    config.headers.forEach(h => {
      if (h.key && h.value) headers[h.key] = applyTestVariables(h.value);
    });
  }

  let body = null;
  if (method !== 'GET' && config.body) {
    body = applyTestVariables(config.body);
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  try {
    const startTime = Date.now();
    const response = await fetch(url, { method, headers, body });
    const elapsed = Date.now() - startTime;
    
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status} ${response.statusText}`,
        fix: 'The external server rejected the request. Check your URL, headers, and body format.',
        data: responseData
      };
    }

    return { success: true, data: responseData, time: elapsed };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      fix: 'Make sure the URL is reachable and properly formatted (e.g., https://...).'
    };
  }
}

async function executeMetaCapiTest(config, userId) {
  if (!config.connectionId) return { success: false, error: 'No Meta account connected', fix: 'Please select a Facebook/Meta account.' };
  if (!config.pixelId) return { success: false, error: 'Missing Pixel ID', fix: 'Enter your Meta Pixel ID or Dataset ID.' };
  if (!config.eventName) return { success: false, error: 'Missing Event Name', fix: 'Enter an event name like Purchase, Lead, or PageView.' };

  const connection = await prisma.integration.findUnique({
    where: { id: config.connectionId }
  });

  if (!connection || connection.clientId !== userId) {
    return { success: false, error: 'Invalid Connection', fix: 'Reconnect your Meta account.' };
  }

  // Build Payload
  const eventName = applyTestVariables(config.eventName);
  const pixelId = applyTestVariables(config.pixelId);
  const isTest = config.isTestEvent === true;
  const testEventCode = config.testEventCode ? applyTestVariables(config.testEventCode) : undefined;
  
  const userData = {};
  const customData = {};

  // Standard Parameters
  const standardFields = [
    'email', 'phone', 'first_name', 'last_name', 'city', 'country_code', 
    'client_ip_address', 'client_user_agent', 'fbc', 'fbp', 'fbclid', 
    'external_id', 'lead_id'
  ];
  standardFields.forEach(f => {
    if (config[`capi_${f}`]) userData[f] = applyTestVariables(config[`capi_${f}`]);
  });

  // Since we are mocking tests, generate a random action source if not provided
  const actionSource = applyTestVariables(config.capi_event_source_url) ? 'website' : 'system_generated';
  const eventSourceUrl = applyTestVariables(config.capi_event_source_url);

  if (config.capi_amount) customData.value = applyTestVariables(config.capi_amount);
  
  // Custom Mapped Data
  if (config.eventDataMapping) {
    config.eventDataMapping.forEach(m => {
      if (m.key && m.value) customData[m.key] = applyTestVariables(m.value);
    });
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: actionSource,
        event_source_url: eventSourceUrl,
        user_data: Object.keys(userData).length > 0 ? userData : { client_ip_address: '127.0.0.1', client_user_agent: 'AutomatixTest/1.0' },
        custom_data: Object.keys(customData).length > 0 ? customData : undefined
      }
    ]
  };

  if (isTest && testEventCode) {
    payload.test_event_code = testEventCode;
  }

  let accessToken = connection.apiKey;
  try {
    const parsed = JSON.parse(connection.apiKey);
    if (parsed.access_token) accessToken = parsed.access_token;
  } catch(e) {}

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

  const startTime = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const elapsed = Date.now() - startTime;

  const data = await res.json();

  if (!res.ok) {
    return {
      success: false,
      error: data.error?.message || 'Meta API Error',
      fix: 'Check your Pixel ID, Access Token permissions, or payload format.',
      data
    };
  }

  return { success: true, data, time: elapsed };
}

async function executeSheetsTest(config, userId) {
  if (!config.spreadsheetId) return { success: false, error: 'Missing Spreadsheet ID', fix: 'Select or enter a spreadsheet URL.' };
  if (!config.range && !config.sheetName) return { success: false, error: 'Missing Worksheet Range', fix: 'Specify a worksheet or range.' };

  const accessToken = await getGoogleAccessToken(config.connectionId, userId);

  if (!accessToken) {
    return { 
      success: false, 
      error: 'No active Google tokens available in the system.', 
      fix: 'Please add Service Account credentials to .env or connect a Google account in the Connections tab.' 
    };
  }

  return await executeGoogleSheetsAction({
    config,
    accessToken,
    resolveVars: applyTestVariables
  });
}

async function executeEmailTest(config, userId) {
  if (!config.connectionId) {
    return { success: false, error: 'Missing Connection', fix: 'Select an SMTP connection.' };
  }
  if (!config.to || !config.subject || !config.body) {
    return { success: false, error: 'Missing Fields', fix: 'Ensure To, Subject, and Body are filled.' };
  }

  // Fetch the connection
  const connection = await prisma.integration.findFirst({
    where: { 
      id: config.connectionId,
      clientId: userId,
      providerName: 'smtp'
    }
  });

  if (!connection) {
    return { success: false, error: 'Connection not found', fix: 'Please reconnect your SMTP account.' };
  }

  try {
    let creds;
    try {
      creds = JSON.parse(connection.apiKey);
    } catch (e) {
      // Fallback if it was saved via old BYOK method
      creds = {
        host: "smtp.gmail.com",
        port: 465,
        encryption: "SSL",
        username: connection.accountEmail,
        password: connection.privateKey ? decrypt(connection.privateKey) : ''
      };
    }
    
    const transporter = nodemailer.createTransport({
      host: creds.host,
      port: parseInt(creds.port),
      secure: creds.encryption?.toLowerCase() === 'ssl' || String(creds.port) === '465',
      auth: {
        user: creds.username,
        pass: creds.password,
      },
    });

    const fromName = applyTestVariables(config.fromName) || connection.name;
    const fromEmail = applyTestVariables(config.fromEmail) || creds.username;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: applyTestVariables(config.to),
      subject: applyTestVariables(config.subject),
    };

    if (config.replyTo) {
      mailOptions.replyTo = applyTestVariables(config.replyTo);
    }

    if (config.bodyType === 'html') {
      let finalHtml = applyTestVariables(config.body);
      
      // Auto-generate plain text fallback by stripping HTML tags
      mailOptions.text = finalHtml.replace(/<[^>]*>?/gm, '');

      // Append unsubscribe footer and List-Unsubscribe header
      if (config.includeUnsubscribe !== false) {
        finalHtml += `\n<br/><br/><div style="font-size: 11px; color: #666; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd;">To stop receiving these emails, <a href="mailto:${fromEmail}?subject=Unsubscribe">unsubscribe here</a>.</div>`;
        mailOptions.list = {
          unsubscribe: {
            url: `mailto:${fromEmail}?subject=Unsubscribe`,
            comment: 'Unsubscribe'
          }
        };
      }
      
      mailOptions.html = finalHtml;
    } else {
      mailOptions.text = applyTestVariables(config.body);
    }

    const info = await transporter.sendMail(mailOptions);

    return { 
      success: true, 
      data: { message: `Email successfully sent to ${applyTestVariables(config.to)}`, messageId: info.messageId } 
    };

  } catch (error) {
    console.error("SMTP Error:", error);
    return { success: false, error: 'Failed to send email', fix: error.message };
  }
}

async function executeDelayTest(config) {
  let targetDate;
  const now = dayjs().utc();
  
  try {
    if (config.delayType === 'duration') {
      const duration = parseInt(applyTestVariables(config.duration || '0'), 10);
      const unit = config.unit || 'minutes';
      if (isNaN(duration)) throw new Error('Invalid duration amount');
      targetDate = now.add(duration, unit);
    } 
    else if (config.delayType === 'until') {
      const untilDateStr = applyTestVariables(config.untilDate || '');
      if (!untilDateStr) throw new Error('Missing until date');
      
      let untilDate = dayjs.utc(untilDateStr);
      if (!untilDate.isValid()) {
         const dateMatch = untilDateStr.match(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/);
         if (dateMatch) {
            untilDate = dayjs.utc(dateMatch[0]);
         } else if (untilDateStr.includes('test_')) {
            untilDate = now.add(7, 'days');
         } else {
            throw new Error(`Invalid date format: ${untilDateStr}`);
         }
      }
      targetDate = untilDate;
    } 
    else if (config.delayType === 'event_based') {
      const eventDateStr = applyTestVariables(config.eventDate || '');
      if (!eventDateStr) throw new Error('Missing event date');
      
      let eventDate = dayjs.utc(eventDateStr);
      if (!eventDate.isValid()) {
         const dateMatch = eventDateStr.match(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/);
         if (dateMatch) {
            eventDate = dayjs.utc(dateMatch[0]);
         } else if (eventDateStr.includes('test_')) {
            eventDate = now.add(7, 'days');
         } else {
            throw new Error(`Invalid event date format: ${eventDateStr}`);
         }
      }
      
      const duration = parseInt(applyTestVariables(config.duration || '0'), 10);
      const unit = config.unit || 'minutes';
      if (isNaN(duration)) throw new Error('Invalid duration amount');
      
      const timing = (config.eventTiming || 'before').toLowerCase();
      if (timing === 'before') {
        targetDate = eventDate.subtract(duration, unit);
      } else {
        targetDate = eventDate.add(duration, unit);
      }
    } else if (config.delayType === 'wait_for_reply') {
      const duration = parseInt(applyTestVariables(config.duration || '1'), 10);
      const unit = config.unit || 'minutes';
      if (isNaN(duration)) throw new Error('Invalid duration amount');
      targetDate = now.add(duration, unit);
    } else {
      throw new Error('Please select a valid delay type.');
    }
    
    if (config.delayType === 'wait_for_reply') {
      return {
        success: true,
        data: {
          reply_timeout: targetDate.format('YYYY-MM-DD HH:mm:ss [UTC]'),
          reply_text: "Mock user reply text for testing",
          message: `Workflow will pause until a reply arrives. If no reply, it times out at ${targetDate.format('YYYY-MM-DD HH:mm:ss [UTC]')}`
        }
      };
    }
    
    return {
      success: true,
      data: {
        resumesAt: targetDate.format('YYYY-MM-DD HH:mm:ss [UTC]'),
        message: `Workflow will pause and resume on ${targetDate.format('YYYY-MM-DD HH:mm:ss [UTC]')}`
      }
    };
  } catch (e) {
    return { success: false, error: e.message, fix: 'Check your date format or duration values.' };
  }
}

async function executeCalendarStatusTest(config) {
  try {
    const bookingId = String(config.bookingId || '').trim();
    if (!bookingId) {
      return { success: false, error: 'Booking ID is required' };
    }

    const booking = await prisma.automatixBooking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (booking.status === 'CANCELLED' || booking.status === 'RESCHEDULED') {
      return { 
        success: false, 
        error: `Execution halted. Booking status is ${booking.status}.`, 
        data: { status: booking.status } 
      };
    }

    return {
      success: true,
      data: {
        status: booking.status,
        startTime: booking.startTime,
        endTime: booking.endTime
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function executeInstagramActionTest(config, userId) {
  if (!config.connectionId) return { success: false, error: 'No Instagram account connected', fix: 'Please select an Instagram account.' };
  if (!config.recipient) return { success: false, error: 'Missing Recipient', fix: 'Enter a valid Instagram Profile ID or Link.' };
  if (!config.message) return { success: false, error: 'Missing Message', fix: 'Enter the text you want to send.' };

  const connection = await prisma.integration.findUnique({
    where: { id: config.connectionId }
  });

  if (!connection || connection.clientId !== userId) {
    return { success: false, error: 'Invalid Connection', fix: 'Reconnect your Instagram account.' };
  }

  let accessToken = connection.apiKey;
  try {
    const parsed = JSON.parse(connection.apiKey);
    if (parsed.access_token) accessToken = parsed.access_token;
  } catch(e) {}

  let recipientId = applyTestVariables(config.recipient);
  if (config.recipientType === 'link') {
    const usernameMatch = recipientId.match(/(?:instagram\.com\/)([a-zA-Z0-9_.]+)/i);
    if (usernameMatch) {
      recipientId = usernameMatch[1];
    }
  }

  const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${accessToken}`;
  const startTime = Date.now();
  let data;

  // 1. Send Media if present
  if (config.messageType === 'media' && config.mediaUrl) {
    const rawMediaUrl = applyTestVariables(config.mediaUrl);
    const cleanUrl = (rawMediaUrl || '').split('?')[0].toLowerCase();
    let attachmentType = 'image';
    if (cleanUrl.match(/\.(mp4|mov|avi|webm|mkv|m4v)$/)) {
      attachmentType = 'video';
    } else if (cleanUrl.match(/\.(mp3|wav|ogg|m4a|aac)$/)) {
      attachmentType = 'audio';
    } else if (cleanUrl.match(/\.(pdf|doc|docx|zip|rar|tar|txt|csv)$/)) {
      attachmentType = 'file';
    }

    const mediaPayload = {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: attachmentType,
          payload: { url: rawMediaUrl, is_reusable: true }
        }
      }
    };
    
    const mediaRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mediaPayload)
    });
    data = await mediaRes.json();
    if (!mediaRes.ok) {
      return { success: false, error: data.error?.message || 'Meta API Error (Media)', fix: 'Check your media URL.', data };
    }
  }

  // 2. Send Text if present
  const msgText = applyTestVariables(config.message);
  if (msgText) {
    const textPayload = {
      recipient: { id: recipientId },
      message: { text: msgText }
    };
    
    const textRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textPayload)
    });
    data = await textRes.json();
    if (!textRes.ok) {
      return { success: false, error: data.error?.message || 'Meta API Error (Text)', fix: 'Check your payload.', data };
    }
  }
  
  const elapsed = Date.now() - startTime;
  
  return {
    success: true,
    data: data,
    time: elapsed
  };
}

async function executeAiMediatorTest(config) {
  const startTime = Date.now();
  const rawProvider = config?.provider || 'native';
  const task = config?.task || 'generate_caption';
  const tone = config?.tone || 'engaging';
  const customPrompt = config?.customPrompt ? applyTestVariables(config.customPrompt) : '';
  const fileDetails = config?.fileDetails || null;
  let mediaUrl = config?.mediaUrl || '';
  if ((!mediaUrl || mediaUrl.includes('{{')) && fileDetails?.fileUrl) {
    mediaUrl = fileDetails.fileUrl;
  } else if (mediaUrl.includes('{{')) {
    mediaUrl = applyTestVariables(mediaUrl);
  }

  let provider = rawProvider;
  let apiKey = config?.apiKey?.trim();
  let keyNameForAudit = null;

  try {
    const session = await auth();
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { aiRadahnApiKey: true, aiRadahnProvider: true }
      });
      if (user?.aiRadahnApiKey) {
        try {
          const parsed = JSON.parse(user.aiRadahnApiKey);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (rawProvider.startsWith('vault_')) {
              const vaultKeyId = rawProvider.replace('vault_', '');
              const found = parsed.find(k => k.id === vaultKeyId);
              if (found && found.apiKey) {
                provider = found.provider || 'gemini';
                apiKey = found.apiKey;
                keyNameForAudit = found.name;
              }
            } else if (!apiKey || rawProvider === 'native' || rawProvider === 'gemini') {
              const primary = parsed.find(k => k.isPrimary) || parsed[0];
              if (primary && primary.apiKey) {
                provider = primary.provider || 'gemini';
                apiKey = primary.apiKey;
                keyNameForAudit = primary.name;
              }
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  if (provider !== 'native' && provider !== 'automatix' && !apiKey && !process.env.GEMINI_API_KEY) {
    return {
      success: false,
      error: 'Missing API Key',
      fix: `Please add a verified API key in AI Radahn Settings or provide a valid ${provider.toUpperCase()} key.`
    };
  }

  const promptText = buildAiPrompt({ task, tone, customPrompt, mediaUrl, fileDetails });

  try {
    const result = await generateAiContent({
      provider,
      apiKey,
      baseUrl: config?.baseUrl,
      customModel: config?.customModel,
      promptText,
      task,
      tone,
      customPrompt,
      mediaUrl,
      fileDetails
    });

    const text = result.text || '';
    const usedModel = result.usedModel;
    const parsed = parseStructuredAiResponse(text, task, tone);

    const nowIso = new Date().toISOString();
    const durationMs = Date.now() - startTime;
    return {
      success: true,
      data: {
        output: parsed.output || text,
        caption: parsed.caption || text,
        title: parsed.title,
        hook: parsed.hook || parsed.title,
        hashtags: parsed.hashtags,
        summary: result.summary || parsed.summary,
        transcript: result.transcript || parsed.transcript,
        actionItems: result.actionItems || parsed.actionItems,
        insights: result.insights || parsed.insights,
        tokensUsed: result.tokens?.total || 0,
        tokens: result.tokens || null,
        model: usedModel,
        provider: usedModel,
        keyName: keyNameForAudit,
        createdAt: nowIso,
        timestamp: nowIso,
        rawOutput: text,
        generationTimeMs: durationMs,
        generationTimeSec: (durationMs / 1000).toFixed(2)
      },
      time: durationMs
    };
  } catch (err) {
    return {
      success: false,
      error: `AI Provider Error: ${err.message}`,
      fix: 'Please verify your API key or switch to the free Automatix Native Engine.'
    };
  }
}

export async function verifyAiKeyAction({ provider = 'gemini', apiKey = '', baseUrl = '' }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { valid: false, error: 'Unauthorized session' };
  }
  return await verifyApiKey({ provider, apiKey, baseUrl });
}

async function executeInstagramPublishTest(config, userId) {
  const startTime = Date.now();
  const publishType = config?.publishType || 'FEED_POST';
  const mediaUrl = config?.mediaUrl ? applyTestVariables(config.mediaUrl) : '';
  const caption = config?.caption ? applyTestVariables(config.caption) : '';

  if (!mediaUrl) {
    return {
      success: false,
      error: 'Missing Media URL',
      fix: 'Please map a valid media file URL (e.g. from your Cloud Storage trigger).'
    };
  }

  return {
    success: true,
    data: {
      status: 'READY_TO_PUBLISH',
      publishType: publishType,
      mediaUrl: mediaUrl,
      caption: caption || '(No caption provided for story)',
      simulatedPostId: `ig_post_${Date.now()}`,
      permalink: 'https://www.instagram.com/p/preview_demo_post/',
      message: `Simulated validation passed! Ready to publish as ${publishType}.`
    },
    time: Date.now() - startTime
  };
}

