import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  // Validate URL
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Only allow CapCut
  if (!parsed.hostname.includes('capcut')) {
    return res.status(400).json({ error: 'Only CapCut URLs allowed' });
  }

  try {
    const response = await axios.post(
      'https://3bic.com/api/download',
      { url },
      {
        headers: {
          'authority': '3bic.com',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          'origin': 'https://3bic.com',
          'pragma': 'no-cache',
          'referer': 'https://3bic.com/',
          'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        },
        responseType: 'stream',
        timeout: 120000,
      }
    );

    // Forward headers
    if (response.headers['content-type']) res.setHeader('Content-Type', response.headers['content-type']);
    if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
    res.setHeader('Content-Disposition', 'attachment; filename="capcut.mp4"');

    // Pipe stream to client
    response.data.pipe(res);
    response.data.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) res.status(502).json({ error: 'Upstream stream error' });
      else res.end();
    });

  } catch (err) {
    console.error('Download error:', err.message || err);
    res.status(500).json({ error: 'Failed to download video' });
  }
}
