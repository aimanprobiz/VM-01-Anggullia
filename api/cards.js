const https = require('https');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim() : '';

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
  }

  const hostname = SUPABASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const path = '/rest/v1/cards?select=*';

  const options = {
    hostname: hostname,
    path: path,
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve) => {
    const request = https.request(options, (response) => {
      let body = '';
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (response.statusCode >= 400) {
            res.status(response.statusCode).json({ error: data.message || 'Supabase error', raw: data });
          } else {
            const records = Array.isArray(data) ? data.map(item => ({ id: item.id, fields: item })) : [];
            res.status(200).json({ records });
          }
        } catch (err) {
          res.status(500).json({ error: 'Failed to parse JSON', raw: body });
        }
        resolve();
      });
    });

    request.on('error', (err) => {
      res.status(500).json({ error: err.message });
      resolve();
    });

    request.end();
  });
}