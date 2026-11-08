// api/cards.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials missing.' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/cards?select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Failed to fetch cards' });
    }

    // Match Airtable's expected format for the frontend
    return res.status(200).json({ records: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}