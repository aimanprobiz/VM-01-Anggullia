// api/businesses.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
  }

  try {
    const cleanUrl = SUPABASE_URL.trim().replace(/\/$/, '');
    const cleanKey = SUPABASE_KEY.trim();

    const response = await fetch(`${cleanUrl}/rest/v1/businesses?select=*`, {
      method: 'GET',
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON response from Supabase', raw: responseText });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Supabase error', details: data });
    }

    const formattedRecords = Array.isArray(data) ? data.map(item => ({
      id: item.id,
      fields: item
    })) : [];

    return res.status(200).json({ records: formattedRecords });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}