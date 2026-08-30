import { cleanValueForSheets } from '@/lib/dateUtils';
import { SYSTEM_LIMITS } from '@/lib/limits';

/**
 * Universal Google Sheets Action Executor
 * Handles WRITE, UPDATE, READ, DELETE, CLEAR, CREATE_SHEET, DUPLICATE_SHEET.
 * Shared between Test Step Runner (testNode.js) and Production Background Worker (inngest/functions.js).
 */
export async function executeGoogleSheetsAction({ config, accessToken, resolveVars = (val) => val }) {
  if (!config.spreadsheetId) {
    return { success: false, error: 'Missing Spreadsheet ID', fix: 'Select or enter a spreadsheet URL.' };
  }
  
  const spreadsheetId = resolveVars(config.spreadsheetId);
  const targetSheetName = resolveVars(config.range || config.sheetName || 'Sheet1');
  const actionType = config.actionType || 'WRITE';
  const parseValues = config.parseValues !== false;
  const startTime = Date.now();

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

  // 1. Fetch Headers (Row 1) for mapping and column lookups
  let headers = [];
  if (!['CREATE_SHEET', 'CLEAR'].includes(actionType)) {
    const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetSheetName)}!1:1`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (getRes.ok) {
      const getData = await getRes.json();
      headers = getData.values && getData.values.length > 0 ? getData.values[0] : [];
    }
  }

  // Auto-extend Google Sheet Headers if new custom fields were added in Automatix configuration!
  if (['WRITE', 'UPDATE'].includes(actionType) && Array.isArray(config.rowDataMapping) && config.rowDataMapping.length > 0) {
    const missingHeaders = [];
    config.rowDataMapping.forEach(m => {
      const fieldName = (m.key || '').trim();
      if (fieldName && !headers.some(h => (h || '').trim().toLowerCase() === fieldName.toLowerCase())) {
        missingHeaders.push(fieldName);
      }
    });

    if (missingHeaders.length > 0) {
      const newHeaders = [...headers, ...missingHeaders];
      // Update Row 1 in Google Sheets with the extended headers right after the last column
      try {
        const updateHeaderRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetSheetName)}!1:1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range: `${targetSheetName}!1:1`,
            majorDimension: 'ROWS',
            values: [newHeaders]
          })
        });

        if (updateHeaderRes.ok) {
          headers = newHeaders;
        }
      } catch (err) {
        console.warn('Could not auto-append headers to Google Sheets:', err);
      }
    }
  }

  // 2. Build rowToInsert from rowDataMapping or rowValues
  const rowToInsert = new Array(headers.length).fill('');
  if (Array.isArray(config.rowDataMapping) && config.rowDataMapping.length > 0) {
    config.rowDataMapping.forEach(m => {
      const hIndex = headers.findIndex(h => (h || '').trim().toLowerCase() === (m.key || '').trim().toLowerCase());
      if (hIndex !== -1) {
        const resolvedVal = resolveVars(m.value !== undefined && m.value !== null ? m.value : '');
        rowToInsert[hIndex] = cleanValueForSheets(resolvedVal, parseValues);
      }
    });
  } else if (config.rowValues) {
    const parsed = typeof config.rowValues === 'string' ? JSON.parse(resolveVars(config.rowValues)) : config.rowValues;
    const items = Array.isArray(parsed) ? parsed : [parsed];
    items.forEach((item, idx) => {
      rowToInsert[idx] = cleanValueForSheets(resolveVars(item), parseValues);
    });
  }

  // ================= ACTION: READ =================
  if (actionType === 'READ') {
    const getAllRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetSheetName)}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const allData = await getAllRes.json();
    if (!getAllRes.ok) return { success: false, error: allData.error?.message, data: allData };

    const rows = allData.values || [];
    if (rows.length <= 1) return { success: true, data: [], time: Date.now() - startTime };

    let results = [];
    let dataRows = rows.slice(1);
    if (config.searchDirection === 'bottom_to_top') {
      dataRows = [...dataRows].reverse();
    }

    let maxCols = SYSTEM_LIMITS?.SHEETS?.MAX_COLUMNS_FETCH || 50;
    let selectedIndices = [];
    if (config.fetchColumnsUpTo) {
      const cols = resolveVars(config.fetchColumnsUpTo).split(',').map(c => c.trim().toUpperCase()).filter(c => c);
      if (cols.length > 0) {
        cols.forEach(letter => {
          const userColIndex = letter.split('').reduce((acc, current) => acc * 26 + current.charCodeAt(0) - 64, 0) - 1;
          if (userColIndex >= 0) selectedIndices.push(userColIndex);
        });
        selectedIndices = selectedIndices.slice(0, maxCols);
      }
    }

    if (selectedIndices.length === 0) {
      selectedIndices = Array.from({ length: Math.min(headers.length, maxCols) }, (_, i) => i);
    }

    if (config.searchQuery) {
      const query = resolveVars(config.searchQuery);
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
        }
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

    return { success: true, data: results, time: Date.now() - startTime };
  }

  // ================= ACTION: UPDATE =================
  if (actionType === 'UPDATE') {
    const getAllRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetSheetName)}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const allData = await getAllRes.json();
    if (!getAllRes.ok) return { success: false, error: allData.error?.message, data: allData };

    const rows = allData.values || [];
    if (rows.length <= 1) return { success: false, error: 'No data found to update.' };

    let matchIndices = [];
    if (config.searchQuery) {
      const query = resolveVars(config.searchQuery);
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

    const updateData = [];
    for (const idx of matchIndices) {
      const rowNumber = idx + 1;
      if (config.rowDataMapping) {
        config.rowDataMapping.forEach(m => {
          const hIndex = headers.findIndex(h => h.trim() === m.key?.trim());
          if (hIndex !== -1 && m.value !== undefined && m.value !== null && m.value !== '') {
            const colLetter = getColLetter(hIndex);
            updateData.push({
              range: `${targetSheetName}!${colLetter}${rowNumber}`,
              values: [[cleanValueForSheets(resolveVars(m.value), parseValues)]]
            });
          }
        });
      }
    }

    const batchUpdateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: parseValues ? 'USER_ENTERED' : 'RAW',
        data: updateData
      })
    });

    const batchUpdateData = await batchUpdateRes.json();
    if (!batchUpdateRes.ok) return { success: false, error: batchUpdateData.error?.message, data: batchUpdateData };

    return { success: true, data: { updatedRows: updateData.length, matches: matchIndices }, time: Date.now() - startTime };
  }

  // ================= ACTION: DELETE =================
  if (actionType === 'DELETE') {
    const getAllRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetSheetName)}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const allData = await getAllRes.json();
    if (!getAllRes.ok) return { success: false, error: allData.error?.message, data: allData };

    const rows = allData.values || [];
    if (rows.length <= 1) return { success: false, error: 'No data found to delete.' };

    let matchIndices = [];
    if (config.searchQuery) {
      const query = resolveVars(config.searchQuery);
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
        }
      }
    }

    if (matchIndices.length === 0) return { success: false, error: 'No matching rows found to delete.' };

    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const metaData = await metaRes.json();
    const sheetObj = metaData.sheets?.find(s => s.properties.title === targetSheetName);
    if (!sheetObj) return { success: false, error: `Could not find sheet tab '${targetSheetName}'.` };

    const numericalSheetId = sheetObj.properties.sheetId;
    matchIndices.sort((a, b) => b - a);

    const requests = matchIndices.map(idx => ({
      deleteDimension: {
        range: {
          sheetId: numericalSheetId,
          dimension: 'ROWS',
          startIndex: idx,
          endIndex: idx + 1
        }
      }
    }));

    const batchUpdateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    const batchUpdateData = await batchUpdateRes.json();
    if (!batchUpdateRes.ok) return { success: false, error: batchUpdateData.error?.message, data: batchUpdateData };

    return { success: true, data: { deletedRows: matchIndices.length, matches: matchIndices }, time: Date.now() - startTime };
  }

  // ================= ACTION: CLEAR =================
  if (actionType === 'CLEAR') {
    const rangeToClear = config.clearRange ? resolveVars(config.clearRange) : '';
    if (!rangeToClear) return { success: false, error: 'Please specify a Range to Clear (e.g. A2:B5 or C3).' };

    const fullRange = `${targetSheetName}!${rangeToClear}`;
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(fullRange)}:clear`;
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

  // ================= ACTION: CREATE_SHEET =================
  if (actionType === 'CREATE_SHEET') {
    const newSheetName = config.newSheetName ? resolveVars(config.newSheetName) : `Sheet_${Date.now()}`;
    const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: newSheetName } } }]
      })
    });
    const createData = await createRes.json();
    if (!createRes.ok) return { success: false, error: createData.error?.message, data: createData };

    return { success: true, data: { createdSheet: newSheetName, sheetId: createData.replies?.[0]?.addSheet?.properties?.sheetId }, time: Date.now() - startTime };
  }

  // ================= ACTION: DUPLICATE_SHEET =================
  if (actionType === 'DUPLICATE_SHEET') {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const metaData = await metaRes.json();
    const sheetObj = metaData.sheets?.find(s => s.properties.title === targetSheetName);
    if (!sheetObj) return { success: false, error: `Could not find source sheet '${targetSheetName}' to duplicate.` };

    const numericalSheetId = sheetObj.properties.sheetId;
    const newSheetName = config.newSheetName ? resolveVars(config.newSheetName) : `${targetSheetName}_Copy`;

    const dupRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
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

  // ================= ACTION: WRITE (APPEND / INSERT) =================
  const insertPosition = config.insertPosition || 'bottom';
  const inheritFormatting = config.inheritFormatting !== false;
  const valueInputOption = parseValues ? 'USER_ENTERED' : 'RAW';

  if (insertPosition === 'top_headers' || insertPosition === 'top_absolute') {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const metaData = await metaRes.json();
    const sheetObj = metaData.sheets?.find(s => s.properties.title === targetSheetName);
    if (!sheetObj) return { success: false, error: `Could not find sheet '${targetSheetName}'.` };

    const numericalSheetId = sheetObj.properties.sheetId;
    const rowIndex = insertPosition === 'top_absolute' ? 0 : 1;

    const insertRowRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
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
              dimension: 'ROWS',
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
      return { success: false, error: errData.error?.message || 'Failed to insert row', data: errData };
    }

    const updateRange = `${targetSheetName}!A${rowIndex + 1}`;
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=${valueInputOption}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [rowToInsert] })
    });

    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      return { success: false, error: updateData.error?.message || 'Failed to update inserted row', data: updateData };
    }
    return { success: true, data: updateData, time: Date.now() - startTime };
  } else {
    // Default bottom append
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetSheetName)}:append?valueInputOption=${valueInputOption}&insertDataOption=INSERT_ROWS`;
    const appendRes = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [rowToInsert] })
    });

    const appendData = await appendRes.json();
    if (!appendRes.ok) {
      return {
        success: false,
        error: appendData.error?.message || 'Failed to append to sheet',
        data: appendData
      };
    }
    return { success: true, data: appendData, time: Date.now() - startTime };
  }
}
