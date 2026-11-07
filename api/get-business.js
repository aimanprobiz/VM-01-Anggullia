// api/get-business.js
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
      return res.status(404).json({ error: 'Invalid or expired edit session.' });
    }

    const currentRecord = data[0];
    const ownerEmail = (currentRecord.owner_email || '').trim().toLowerCase();

    let allBusinesses = [];
    if (ownerEmail) {
      const allRes = await fetch(
        `${SUPABASE_URL}/rest/v1/businesses?owner_email=eq.${encodeURIComponent(ownerEmail)}&select=id,name,edit_token`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const allData = await allRes.json();
      if (allRes.ok && allData) {
        allBusinesses = allData.map(r => ({
          id: r.id,
          name: r.name || 'Unnamed Business',
          token: r.edit_token
        })).filter(b => b.token);
      }
    }

    let rawAffiliate = currentRecord.affiliate_interest || 'No';
    let formattedAffiliate = rawAffiliate.toLowerCase().startsWith('yes') ? 'Yes' : 'No';

    return res.status(200).json({
      recordId: currentRecord.id,
      name: currentRecord.name || '',
      subtitle: currentRecord.subtitle || '',
      category: currentRecord.category || '',
      description: currentRecord.description || '',
      phone: currentRecord.phone || '',
      websiteUrl: currentRecord.website_url || '',
      instagramUrl: currentRecord.instagram_url || '',
      tiktokUrl: currentRecord.tiktok_url || '',
      imageUrl: currentRecord.image_url || '',
      ownerEmail: currentRecord.owner_email || '',
      slug: currentRecord.slug || '',
      status: currentRecord.status || 'Pending',
      affiliateInterest: formattedAffiliate,
      allBusinesses: allBusinesses
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}