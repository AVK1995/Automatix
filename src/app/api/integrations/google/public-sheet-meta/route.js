import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId');
    const sheetName = searchParams.get('sheetName');

    if (!sheetId) {
      return NextResponse.json({ success: false, error: 'sheetId is required' }, { status: 400 });
    }

    if (sheetName) {
      // Fetch column headers for specific sheet
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(url, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sheet headers. Ensure the sheet is public.');
      }
      
      const csvData = await response.text();
      // Parse the first line to get headers
      const firstLine = csvData.split('\n')[0];
      if (!firstLine) {
        return NextResponse.json({ success: true, headers: [] });
      }
      
      const headers = firstLine.split(',').map(s => s.replace(/^"|"$/g, ''));
      // Filter out entirely blank columns
      const filteredHeaders = headers.filter(h => h.trim() !== '');
      
      return NextResponse.json({ success: true, headers: filteredHeaders });
    } else {
      // Fetch list of sheet names (tabs)
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`;
      const response = await fetch(url, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sheet metadata. Ensure the sheet is public.');
      }
      
      const htmlData = await response.text();
      const regex = /\{name:\s*"([^"]+)",\s*pageUrl/g;
      let match;
      const sheets = [];
      while ((match = regex.exec(htmlData)) !== null) {
        sheets.push(match[1]);
      }
      
      // htmlview sometimes has duplicates if there are hidden/extra metadata. We can deduplicate.
      const uniqueSheets = [...new Set(sheets)];
      
      const titleMatch = htmlData.match(/<title>([^<]+)<\/title>/);
      const spreadsheetName = titleMatch ? titleMatch[1].replace(' - Google Sheets', '').trim() : 'Unknown Spreadsheet';
      
      return NextResponse.json({ success: true, sheets: uniqueSheets, spreadsheetName });
    }
    
  } catch (error) {
    console.error('Google Sheets Meta Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
