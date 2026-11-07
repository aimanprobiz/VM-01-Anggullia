// api/redeem.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { businessId, actionType } = req.body || {};

  if (!businessId || !actionType) {
    return res.status(400).json({ error: 'Missing businessId or actionType' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured properly.' });
  }

  try {
    // 1. Fetch current counter values
    const getRes = await fetch(
      `${SUPABASE_URL}/rest/v1/businesses?id=eq.${businessId}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const getData = await getRes.json();
    if (!getRes.ok || !getData || getData.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const b = getData[0];
    const updateData = {};

    // 2. Increment the appropriate counter based on actionType
    switch (actionType) {
      case 'whatsapp':
        updateData.whatsapp_clicks = (b.whatsapp_clicks || 0) + 1;
        break;
      case 'code':
        updateData.code_clicks = (b.code_clicks || 0) + 1;
        break;
      case 'copy':
        updateData.code_copies = (b.code_copies || 0) + 1;
        break;
      case 'website':
        updateData.website_clicks = (b.website_clicks || 0) + 1;
        break;
      case 'instagram':
        updateData.instagram_clicks = (b.instagram_clicks || 0) + 1;
        break;
      case 'tiktok':
        updateData.tiktok_clicks = (b.tiktok_clicks || 0) + 1;
        break;
      case 'social_whatsapp':
        updateData.social_whatsapp_clicks = (b.social_whatsapp_clicks || 0) + 1;
        break;
      case 'redemption':
        updateData.redemptions_count = (b.redemptions_count || 0) + 1;
        break;
      default:
        return res.status(400).json({ error: 'Invalid actionType' });
    }

    // 3. Save incremented counters back to Supabase
    const patchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/businesses?id=eq.${businessId}`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateData)
      }
    );

    if (!patchRes.ok) {
      return res.status(500).json({ error: 'Failed to update analytics counter' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}