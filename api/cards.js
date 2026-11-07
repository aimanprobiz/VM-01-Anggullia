// api/cards.js
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials are not configured' });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/cards?select=*&order=display_order.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ supabaseError: data });
    }

    // Map Postgres snake_case columns back to what your frontend script expects
    const cards = data.map((record) => ({
      id: record.id,
      imageUrl: record.image_url || '',
      Title: record.title || '',
      url: record.links || '',
    }));

    return res.status(200).json(cards);
  } catch (error) {
    return res.status(500).json({ caughtError: error.message });
  }
}