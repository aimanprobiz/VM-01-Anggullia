export default async function handler(req, res) {
  try {
    const SUPABASE_URL = "https://qswifsqfyufdjhumwze.supabase.co";
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_KEY) {
      return res.status(200).json({ records: [], error: "Missing SUPABASE_SERVICE_ROLE_KEY" });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/cards?select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY.trim(),
        'Authorization': `Bearer ${SUPABASE_KEY.trim()}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({ records: [], supabaseError: data });
    }

    const records = Array.isArray(data) ? data.map(item => ({
      id: String(item.id || ''),
      fields: item
    })) : [];

    return res.status(200).json({ records });
  } catch (err) {
    return res.status(200).json({ records: [], caughtError: err.message });
  }
}