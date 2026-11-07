// api/businesses.js
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=86400');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials are not configured' });
  }

  try {
    // Fetch only active businesses from Supabase
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/businesses?status=eq.Active&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch data from Supabase');
    }

    const data = await response.json();

    // Map Postgres columns to camelCase / uppercase keys that your frontend expects
    const businesses = data.map(record => ({
      id: record.id,
      Name: record.name,
      SubTitle: record.subtitle,
      Category: record.category,
      Description: record.description,
      Phone: record.phone,
      WebsiteURL: record.website_url,
      InstagramURL: record.instagram_url,
      TikTokURL: record.tiktok_url,
      ImageURL: record.image_url,
      OwnerEmail: record.owner_email,
      Status: record.status,
      Slug: record.slug || (record.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      Deal: record.deal || '',
      IsFeatured: record.is_featured || false,
      PIN: record.pin || '1234',
      PromoCode: record.promo_code || '',
      ActionType: record.action_type || 'claim'
    }));

    return res.status(200).json(businesses);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to load business listings' });
  }
}