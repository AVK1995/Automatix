import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getMimeFromFilename(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp4': return 'video/mp4';
    case 'mov': return 'video/quicktime';
    case 'webm': return 'video/webm';
    case 'm4v': return 'video/x-m4v';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'pdf': return 'application/pdf';
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'm4a': return 'audio/mp4';
    case 'zip': return 'application/zip';
    case 'json': return 'application/json';
    case 'csv': return 'text/csv';
    case 'txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
}

function extractDriveId(url = '') {
  if (!url) return null;
  const match1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) return match1[1];
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) return match2[1];
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const driveId = searchParams.get('id') || extractDriveId(targetUrl);
    const filename = searchParams.get('filename') || 'file';

    if (!targetUrl && !driveId) {
      return NextResponse.json({ error: 'Missing url or id parameter' }, { status: 400 });
    }

    let fetchUrl = targetUrl;
    if (driveId) {
      // Use direct Googleusercontent CDN or Google Drive export link
      fetchUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
    }

    let response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      redirect: 'follow'
    });

    // Check if Google Drive returned a virus scan confirmation page (HTML)
    const contentType = response.headers.get('content-type') || '';
    if (driveId && contentType.includes('text/html')) {
      const htmlText = await response.text();
      // Try to extract confirm token or alternate download link
      const confirmMatch = htmlText.match(/confirm=([a-zA-Z0-9_-]+)/) || htmlText.match(/name="confirm" value="([a-zA-Z0-9_-]+)"/);
      if (confirmMatch && confirmMatch[1]) {
        const confirmedUrl = `https://drive.google.com/uc?export=download&id=${driveId}&confirm=${confirmMatch[1]}`;
        response = await fetch(confirmedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          redirect: 'follow'
        });
      } else {
        // Fallback to direct lh3 CDN
        const lh3Url = `https://lh3.googleusercontent.com/d/${driveId}`;
        const lh3Response = await fetch(lh3Url, { redirect: 'follow' });
        if (lh3Response.ok && !lh3Response.headers.get('content-type')?.includes('text/html')) {
          response = lh3Response;
        }
      }
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Remote storage returned HTTP ${response.status}` }, { status: response.status });
    }

    const resolvedMime = getMimeFromFilename(filename) || response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    const headers = new Headers();
    headers.set('Content-Type', resolvedMime);
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new Response(response.body, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Media Raw Streamer Error:', error);
    return NextResponse.json({ error: 'Failed to stream media', details: error.message }, { status: 500 });
  }
}

export async function HEAD(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const driveId = searchParams.get('id') || extractDriveId(targetUrl);
    const filename = searchParams.get('filename') || 'file';

    const resolvedMime = getMimeFromFilename(filename);
    const headers = new Headers();
    headers.set('Content-Type', resolvedMime);
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(null, {
      status: 200,
      headers
    });
  } catch (e) {
    return new Response(null, { status: 500 });
  }
}
