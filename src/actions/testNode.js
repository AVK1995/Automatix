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
    const trackingId = config.connectionId || integrationId;
    if (trackingId && !['http', 'sheets', 'formatter_text', 'formatter_math', 'formatter_datetime', 'json_parser', 'custom_variable', 'date_formatter', 'code', 'delay', 'condition'].includes(trackingId)) {
      // Internal nodes don't count towards quota, only external connections
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

  let connection = null;
  let accessToken = null;

  if (config.connectionId) {
    connection = await prisma.integration.findUnique({
      where: { id: config.connectionId }
    });
    if (connection) {
      try {
        const parsed = JSON.parse(connection.apiKey);
        if (parsed.access_token) accessToken = parsed.access_token;
        else accessToken = connection.apiKey;
      } catch(e) {
        accessToken = connection.apiKey;
      }
    }
  }

  // If no explicit connection is found or it lacks a token, try Service Account Fallback
  if (!accessToken && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      // Fix private key newlines if they are escaped in env
      const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
      const auth = new GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: privateKey
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      accessToken = tokenResponse.token;
    } catch (e) {
      console.error('Service Account Auth Error:', e);
    }
  }

  // Legacy fallback: Try to find ANY Google connection in the database to use as a generic worker token
  if (!accessToken) {
    connection = await prisma.integration.findFirst({
      where: { providerName: { in: ['google', 'sheets'] } }
    });
    if (connection) {
      try {
        const parsed = JSON.parse(connection.apiKey);
        if (parsed.access_token) accessToken = parsed.access_token;
        else accessToken = connection.apiKey;
      } catch(e) {
        accessToken = connection.apiKey;
      }
    }
  }

  if (!accessToken) {
    return { 
      success: false, 
      error: 'No active Google tokens available in the system.', 
      fix: 'Please add Service Account credentials to .env or connect a Google account in the Connections tab.' 
    };
  }

  // The config has `rowDataMapping` array of {key, value}
  // To append to Sheets via REST API, we need to know the columns.
  // Actually, sheets API append expects a 2D array of values.
  const targetSheetName = config.range || config.sheetName;
  
  try {
    // 1. Fetch Headers (Row 1)
    const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(targetSheetName)}!1:1`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!getRes.ok) {
      const errData = await getRes.json();
      return {
        success: false, 
        error: errData.error?.message || 'Failed to read sheet headers',
        fix: 'Ensure the sheet has header names in row 1, and the connection has proper permissions.',
        data: errData
      };
    }
    
    const getData = await getRes.json();
    const headers = getData.values && getData.values.length > 0 ? getData.values[0] : [];
    
    // Helper to strip trailing timezone characters so Sheets can parse dates natively
    const cleanValueForSheets = (val) => {
      if (config.parseValues !== false && typeof val === 'string') {
        const dateMatch = val.match(/^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)(?:\s+[a-zA-Z\/\s_]+)?$/);
        if (dateMatch) return dateMatch[1];
      }
      return val;
    };

    // 2. Map rowDataMapping to the header array
    const rowToInsert = new Array(headers.length).fill('');
    if (config.rowDataMapping) {
      config.rowDataMapping.forEach(m => {
        const hIndex = headers.findIndex(h => h.trim() === m.key.trim());
        if (hIndex !== -1) {
          rowToInsert[hIndex] = cleanValueForSheets(applyTestVariables(m.value));
        }
      });
    }

    if (config.actionType === 'READ') {
      const startTime = Date.now();
      const getAllRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(targetSheetName)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const allData = await getAllRes.json();
      if (!getAllRes.ok) {
        return { success: false, error: allData.error?.message, data: allData };
      }
      
      const rows = allData.values || [];
      if (rows.length <= 1) return { success: true, data: [], time: Date.now() - startTime };

      let results = [];
      let dataRows = rows.slice(1);
      
      if (config.searchDirection === 'bottom_to_top') {
        dataRows = [...dataRows].reverse();
      }
      
      let maxCols = SYSTEM_LIMITS.SHEETS.MAX_COLUMNS_FETCH;
      let selectedIndices = [];

      if (config.fetchColumnsUpTo) {
         const cols = config.fetchColumnsUpTo.split(',').map(c => c.trim().toUpperCase()).filter(c => c);
         if (cols.length > 0) {
            cols.forEach(letter => {
               const userColIndex = letter.split('').reduce((acc, current) => acc * 26 + current.charCodeAt(0) - 64, 0) - 1;
               if (userColIndex >= 0) selectedIndices.push(userColIndex);
            });
            selectedIndices = selectedIndices.slice(0, maxCols);
         }
      }
      
      if (selectedIndices.length === 0) {
         selectedIndices = Array.from({length: Math.min(headers.length, maxCols)}, (_, i) => i);
      }
      
      if (config.searchQuery) {
        const query = applyTestVariables(config.searchQuery);
        const match = query.match(/(.+?)\s*(=|>|<|!=|IN|in)\s*(.+)/i);
        
        if (match) {
          const [, colName, opRaw, val] = match;
          const op = opRaw.toLowerCase();
          let colIndex = headers.findIndex(h => h.trim().toLowerCase() === colName.trim().toLowerCase());
          
          if (colIndex === -1 && colName.trim().toLowerCase().startsWith('column ')) {
             const letter = colName.trim().split(' ')[1]?.toUpperCase();
             if (letter) {
                colIndex = letter.split('').reduce((acc, current) => acc * 26 + current.charCodeAt(0) - 64, 0) - 1;
             }
          }

          if (colIndex !== -1) {
            const targetVal = val.trim().toLowerCase();
            const targetVals = op === 'in' ? val.split(',').map(v => v.trim().toLowerCase()) : [];
            
            dataRows.forEach((r, idx) => {
              const originalIndex = config.searchDirection === 'bottom_to_top' ? rows.length - 1 - idx : idx + 2;
              const cellVal = (r[colIndex] || '').toLowerCase();
              let isMatch = false;
              if (op === '=') isMatch = cellVal === targetVal;
              else if (op === '!=') isMatch = cellVal !== targetVal;
              else if (op === '>') isMatch = parseFloat(cellVal) > parseFloat(targetVal);
              else if (op === '<') isMatch = parseFloat(cellVal) < parseFloat(targetVal);
              else if (op === 'in') isMatch = targetVals.includes(cellVal);
              
              if (isMatch) {
                if (config.returnRowData === false) {
                  results.push({ exists: true, rowIndex: originalIndex });
                } else {
                  const rowObj = { _rowIndex: originalIndex };
                  selectedIndices.forEach(i => {
                    if (headers[i]) rowObj[headers[i]] = r[i] || '';
                  });
                  results.push(rowObj);
                }
              }
            });
          } else {
             return { success: false, error: `Column '${colName.trim()}' not found in sheet.` };
          }
        } else {
           dataRows.forEach((r, idx) => {
             const originalIndex = config.searchDirection === 'bottom_to_top' ? rows.length - 1 - idx : idx + 2;
             if (config.returnRowData === false) {
                results.push({ exists: true, rowIndex: originalIndex });
             } else {
                const rowObj = { _rowIndex: originalIndex };
                selectedIndices.forEach(i => {
                  if (headers[i]) rowObj[headers[i]] = r[i] || '';
                });
                results.push(rowObj);
             }
           });
        }
      } else {
        dataRows.forEach((r, idx) => {
           const originalIndex = config.searchDirection === 'bottom_to_top' ? rows.length - 1 - idx : idx + 2;
           if (config.returnRowData === false) {
              results.push({ exists: true, rowIndex: originalIndex });
           } else {
              const rowObj = { _rowIndex: originalIndex };
              selectedIndices.forEach(i => {
                if (headers[i]) rowObj[headers[i]] = r[i] || '';
              });
              results.push(rowObj);
           }
        });
      }
      
      if (results.length === 0) {
        return { 
          success: false, 
          error: 'Please check the row value. The search is case-sensitive. No data found for the current search value.',
          fix: 'Verify the column name, value formatting, and case sensitivity.',
          data: []
        };
      }
      
      if (results.length > SYSTEM_LIMITS.SHEETS.MAX_ROWS_FETCH) {
        results = results.slice(0, SYSTEM_LIMITS.SHEETS.MAX_ROWS_FETCH);
      }
      
      return { success: true, data: results, time: Date.now() - startTime };
    }

    if (config.actionType === 'UPDATE') {
      const startTime = Date.now();
      const getAllRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(targetSheetName)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const allData = await getAllRes.json();
      if (!getAllRes.ok) return { success: false, error: allData.error?.message, data: allData };
      
      const rows = allData.values || [];
      if (rows.length <= 1) return { success: false, error: 'No data found to update.' };

      let matchIndices = [];
      
      if (config.searchQuery) {
        const query = applyTestVariables(config.searchQuery);
        const match = query.match(/(.+?)\s*(=|>|<|!=|IN|in)\s*(.+)/i);
        
        if (match) {
          const [, colName, opRaw, val] = match;
          const op = opRaw.toLowerCase();
          let colIndex = headers.findIndex(h => h.trim().toLowerCase() === colName.trim().toLowerCase());
          
          if (colIndex === -1 && colName.trim().toLowerCase().startsWith('column ')) {
             const letter = colName.trim().split(' ')[1]?.toUpperCase();
             if (letter) colIndex = letter.split('').reduce((acc, current) => acc * 26 + current.charCodeAt(0) - 64, 0) - 1;
          }

          if (colIndex !== -1) {
            const targetVal = val.trim().toLowerCase();
            const targetVals = op === 'in' ? val.split(',').map(v => v.trim().toLowerCase()) : [];
            
            for (let i = 1; i < rows.length; i++) {
              const cellVal = (rows[i][colIndex] || '').toLowerCase();
              let isMatch = false;
              if (op === '=') isMatch = cellVal === targetVal;
              else if (op === '!=') isMatch = cellVal !== targetVal;
              else if (op === '>') isMatch = parseFloat(cellVal) > parseFloat(targetVal);
              else if (op === '<') isMatch = parseFloat(cellVal) < parseFloat(targetVal);
              else if (op === 'in') isMatch = targetVals.includes(cellVal);
              
              if (isMatch) matchIndices.push(i);
            }
          } else {
             return { success: false, error: `Column '${colName.trim()}' not found in sheet.` };
          }
        }
      }

      if (matchIndices.length === 0) return { success: false, error: 'No matching rows found to update.' };

      // We need to construct batch updates for each matched row
      // A matched row at index i corresponds to sheet row i+1
      const updateData = [];
      
      // Helper to convert 0-based index to A, B, Z, AA, etc.
      const getColLetter = (index) => {
        let temp = index;
        let letter = '';
        while (temp >= 0) {
          letter = String.fromCharCode((temp % 26) + 65) + letter;
          temp = Math.floor(temp / 26) - 1;
        }
        return letter;
      };

      const cleanValueForSheets = (val) => {
        if (config.parseValues === false) return val;
        const strVal = String(val);
        // If it looks like a date/iso string, keep it as is; USER_ENTERED handles it.
        // Adding aggressive parsing or return logic if needed here.
        return strVal;
      };

      for (const idx of matchIndices) {
         const rowNumber = idx + 1;
         
         if (config.rowDataMapping) {
           config.rowDataMapping.forEach(m => {
             const hIndex = headers.findIndex(h => h.trim() === m.key.trim());
             if (hIndex !== -1 && m.value !== undefined && m.value !== null && m.value !== '') {
               const colLetter = getColLetter(hIndex);
               updateData.push({
                 range: `${targetSheetName}!${colLetter}${rowNumber}`,
                 values: [[cleanValueForSheets(applyTestVariables(m.value))]]
               });
             }
           });
         }
      }

      const batchUpdateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valueInputOption: config.parseValues === false ? 'RAW' : 'USER_ENTERED',
          data: updateData
        })
      });

      const batchUpdateData = await batchUpdateRes.json();
      if (!batchUpdateRes.ok) return { success: false, error: batchUpdateData.error?.message, data: batchUpdateData };

      return { success: true, data: { updatedRows: updateData.length, matches: matchIndices }, time: Date.now() - startTime };
    }

    if (config.actionType === 'DELETE') {
      const startTime = Date.now();
      const getAllRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(targetSheetName)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const allData = await getAllRes.json();
      if (!getAllRes.ok) return { success: false, error: allData.error?.message, data: allData };
      
      const rows = allData.values || [];
      if (rows.length <= 1) return { success: false, error: 'No data found to delete.' };

      let matchIndices = [];
      
      if (config.searchQuery) {
        const query = applyTestVariables(config.searchQuery);
        const match = query.match(/(.+?)\s*(=|>|<|!=|IN|in)\s*(.+)/i);
        
        if (match) {
          const [, colName, opRaw, val] = match;
          const op = opRaw.toLowerCase();
          let colIndex = headers.findIndex(h => h.trim().toLowerCase() === colName.trim().toLowerCase());
          
          if (colIndex === -1 && colName.trim().toLowerCase().startsWith('column ')) {
             const letter = colName.trim().split(' ')[1]?.toUpperCase();
             if (letter) colIndex = letter.split('').reduce((acc, current) => acc * 26 + current.charCodeAt(0) - 64, 0) - 1;
          }

          if (colIndex !== -1) {
            const targetVal = val.trim().toLowerCase();
            const targetVals = op === 'in' ? val.split(',').map(v => v.trim().toLowerCase()) : [];
            
            for (let i = 1; i < rows.length; i++) {
              const cellVal = (rows[i][colIndex] || '').toLowerCase();
              let isMatch = false;
              if (op === '=') isMatch = cellVal === targetVal;
              else if (op === '!=') isMatch = cellVal !== targetVal;
              else if (op === '>') isMatch = parseFloat(cellVal) > parseFloat(targetVal);
              else if (op === '<') isMatch = parseFloat(cellVal) < parseFloat(targetVal);
              else if (op === 'in') isMatch = targetVals.includes(cellVal);
              
              if (isMatch) matchIndices.push(i);
            }
          } else {
             return { success: false, error: `Column '${colName.trim()}' not found in sheet.` };
          }
        }
      }

      if (matchIndices.length === 0) return { success: false, error: 'No matching rows found to delete.' };

      // Get the numerical sheetId required for dimension operations
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?includeGridData=false`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const metaData = await metaRes.json();
      const sheetObj = metaData.sheets?.find(s => s.properties.title === targetSheetName);
      if (!sheetObj) return { success: false, error: `Could not find numerical ID for sheet tab '${targetSheetName}'.` };
      
      const numericalSheetId = sheetObj.properties.sheetId;

      // Delete from bottom to top so indices don't shift during batch delete
      matchIndices.sort((a, b) => b - a);
      
      const requests = matchIndices.map(idx => ({
        deleteDimension: {
          range: {
            sheetId: numericalSheetId,
            dimension: "ROWS",
            startIndex: idx,
            endIndex: idx + 1
          }
        }
      }));

      const batchUpdateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: requests
        })
      });

      const batchUpdateData = await batchUpdateRes.json();
      if (!batchUpdateRes.ok) return { success: false, error: batchUpdateData.error?.message, data: batchUpdateData };

      return { success: true, data: { deletedRows: matchIndices.length, matches: matchIndices }, time: Date.now() - startTime };
    }

    if (config.actionType === 'CLEAR') {
      const startTime = Date.now();
      const rangeToClear = config.clearRange ? applyTestVariables(config.clearRange) : '';
      if (!rangeToClear) return { success: false, error: 'Please specify a Range to Clear (e.g. A2:B5 or C3).' };

      const fullRange = `${targetSheetName}!${rangeToClear}`;
      const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(fullRange)}:clear`;
      
      const clearRes = await fetch(clearUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const clearData = await clearRes.json();
      if (!clearRes.ok) return { success: false, error: clearData.error?.message, data: clearData };

      return { success: true, data: { clearedRange: clearData.clearedRange || fullRange }, time: Date.now() - startTime };
    }

    if (config.actionType === 'CREATE_SHEET') {
      const startTime = Date.now();
      const newSheetName = config.newSheetName ? applyTestVariables(config.newSheetName) : `Sheet_${Date.now()}`;
      
      const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            addSheet: { properties: { title: newSheetName } }
          }]
        })
      });
      
      const createData = await createRes.json();
      if (!createRes.ok) return { success: false, error: createData.error?.message, data: createData };

      return { success: true, data: { createdSheet: newSheetName, sheetId: createData.replies?.[0]?.addSheet?.properties?.sheetId }, time: Date.now() - startTime };
    }

    if (config.actionType === 'DUPLICATE_SHEET') {
      const startTime = Date.now();
      
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?includeGridData=false`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const metaData = await metaRes.json();
      const sheetObj = metaData.sheets?.find(s => s.properties.title === targetSheetName);
      if (!sheetObj) return { success: false, error: `Could not find source sheet '${targetSheetName}' to duplicate.` };
      
      const numericalSheetId = sheetObj.properties.sheetId;
      const newSheetName = config.newSheetName ? applyTestVariables(config.newSheetName) : `${targetSheetName}_Copy`;

      const dupRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            duplicateSheet: {
              sourceSheetId: numericalSheetId,
              newSheetName: newSheetName
            }
          }]
        })
      });
      
      const dupData = await dupRes.json();
      if (!dupRes.ok) return { success: false, error: dupData.error?.message, data: dupData };

      return { success: true, data: { duplicatedSheet: newSheetName, newSheetId: dupData.replies?.[0]?.duplicateSheet?.properties?.sheetId }, time: Date.now() - startTime };
    }

    // 3. Append (Default WRITE)
    const insertPosition = config.insertPosition || 'bottom';
    const inheritFormatting = config.inheritFormatting !== false;
    const startTime = Date.now();

    if (insertPosition === 'top_headers' || insertPosition === 'top_absolute') {
      // Fetch numerical sheet ID first
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?includeGridData=false`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const metaData = await metaRes.json();
      const sheetObj = metaData.sheets?.find(s => s.properties.title === targetSheetName);
      
      if (!sheetObj) {
        return { success: false, error: `Could not find source sheet '${targetSheetName}' to insert into.` };
      }
      const numericalSheetId = sheetObj.properties.sheetId;
      const rowIndex = insertPosition === 'top_absolute' ? 0 : 1; // 0-indexed for API

      // Step 1: Insert an empty row
      const insertRowRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            insertDimension: {
              range: {
                sheetId: numericalSheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              },
              inheritFromBefore: inheritFormatting && rowIndex > 0
            }
          }]
        })
      });

      if (!insertRowRes.ok) {
        const errData = await insertRowRes.json();
        return {
          success: false,
          error: errData.error?.message || 'Failed to insert row',
          data: errData
        };
      }

      // Step 2: Update the newly inserted row with data
      const valueInputOption = config.parseValues === false ? 'RAW' : 'USER_ENTERED';
      const updateRange = `${targetSheetName}!A${rowIndex + 1}`;
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=${valueInputOption}`;
      const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [rowToInsert]
        })
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        return {
          success: false,
          error: updateData.error?.message || 'Failed to update inserted row',
          data: updateData
        };
      }
      return { success: true, data: updateData, time: Date.now() - startTime };
    } else {
      // Default bottom append
      const valueInputOption = config.parseValues === false ? 'RAW' : 'USER_ENTERED';
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(targetSheetName)}:append?valueInputOption=${valueInputOption}&insertDataOption=INSERT_ROWS`;
      const appendRes = await fetch(appendUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [rowToInsert]
        })
      });
      const elapsed = Date.now() - startTime;
      const appendData = await appendRes.json();

      if (!appendRes.ok) {
        return {
          success: false,
          error: appendData.error?.message || 'Failed to append to sheet',
          fix: 'Check if your columns match the sheet headers exactly.',
          data: appendData
        };
      }

      // If inheritFormatting is false, we clear the formatting of the newly appended row
      if (!inheritFormatting && appendData.updates?.updatedRange) {
        // extract SheetId again if needed, or we can use the A1 notation directly with clear endpoint?
        // Actually, we can use the values:clear endpoint? No, that clears data.
        // To clear ONLY formatting, we need batchUpdate with numericalSheetId and GridRange, which is complex because we need the numericalSheetId.
        // Fetch numerical sheet ID first if not already fetched
        const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?includeGridData=false`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const metaData = await metaRes.json();
        const sheetObj = metaData.sheets?.find(s => s.properties.title === targetSheetName);
        if (sheetObj) {
          const numericalSheetId = sheetObj.properties.sheetId;
          const updatedRange = appendData.updates.updatedRange; // e.g., 'Sheet1'!A3:D3
          
          // Parse the range (e.g. A3:D3)
          const rangeMatch = updatedRange.match(/!([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/);
          if (rangeMatch) {
            const startRow = parseInt(rangeMatch[2], 10) - 1;
            const endRow = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : startRow + 1;
            
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                requests: [{
                  repeatCell: {
                    range: {
                      sheetId: numericalSheetId,
                      startRowIndex: startRow,
                      endRowIndex: endRow
                    },
                    cell: { userEnteredFormat: {} },
                    fields: "userEnteredFormat"
                  }
                }]
              })
            });
          }
        }
      }

      return { success: true, data: appendData, time: elapsed };
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      fix: 'Make sure your Google account is fully connected.'
    };
  }
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
    const mediaPayload = {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: "image",
          payload: { url: applyTestVariables(config.mediaUrl) }
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
      return { success: false, error: data.error?.message || 'Meta API Error (Media)', fix: 'Check your image URL.', data };
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
