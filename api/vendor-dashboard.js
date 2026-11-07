// api/vendor-dashboard.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || !token.trim()) {
    return res.status(400).json({ error: 'Edit token is required.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured properly.' });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/businesses?edit_token=eq.${encodeURIComponent(token.trim())}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data || data.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired session token.' });
    }

    const b = data[0];

    const stats = {
      whatsappClicks: b.whatsapp_clicks || 0,
      codeClicks: b.code_clicks || 0,
      codeCopies: b.code_copies || 0,
      websiteClicks: b.website_clicks || 0,
      instagramClicks: b.instagram_clicks || 0,
      tiktokClicks: b.tiktok_clicks || 0,
      socialWhatsappClicks: b.social_whatsapp_clicks || 0,
      redemptionsCount: b.redemptions_count || 0
    };

    return res.status(200).json({
      name: b.name || '',
      subtitle: b.subtitle || '',
      category: b.category || '',
      imageUrl: b.image_url || '',
      status: b.status || 'Pending',
      stats: stats
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}