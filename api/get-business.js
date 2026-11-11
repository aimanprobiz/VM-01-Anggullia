// api/get-business.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || !token.trim()) {
    return res.status(400).json({ success: false, error: 'Edit token is required.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qswifsfqyufdjhunvwze.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_KEY) {
    return res.status(500).json({ success: false, error: 'Supabase service role key missing.' });
  }

  try {
    const cleanToken = token.trim();

    // Query using lowercase snake_case column edit_token
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/businesses?edit_token=eq.${encodeURIComponent(cleanToken)}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ success: false, error: 'Invalid or expired edit session.' });
    }

    const rec = data[0];
    const recId = rec.id || rec.ID || '';
    const ownerEmail = (rec.owner_email || rec.OwnerEmail || '').trim().toLowerCase();

    let allBusinesses = [];
    if (ownerEmail) {
      try {
        const allRes = await fetch(
          `${SUPABASE_URL}/rest/v1/businesses?owner_email=eq.${encodeURIComponent(ownerEmail)}&select=*`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`
            }
          }
        );
        const allData = await allRes.json();
        if (allRes.ok && Array.isArray(allData)) {
          allBusinesses = allData.map(r => ({
            id: r.id || r.ID || '',
            name: r.name || r.Name || 'Unnamed Business',
            token: r.edit_token || r.EditToken || ''
          })).filter(b => b.token);
        }
      } catch (e) {
        allBusinesses = [];
      }
    }

    const rawAffiliate = String(rec.affiliate_interest || rec.AffiliateInterest || 'No');
    const formattedAffiliate = rawAffiliate.toLowerCase().startsWith('yes') ? 'Yes' : 'No';

    return res.status(200).json({
      success: true,
      recordId: recId,
      id: recId,
      name: rec.name || rec.Name || '',
      subtitle: rec.subtitle || rec.Subtitle || '',
      category: rec.category || rec.Category || '',
      description: rec.description || rec.Description || '',
      phone: rec.phone || rec.Phone || '',
      websiteUrl: rec.website_url || rec.WebsiteUrl || '',
      instagramUrl: rec.instagram_url || rec.InstagramUrl || '',
      tiktokUrl: rec.tiktok_url || rec.TiktokUrl || '',
      imageUrl: rec.image_url || rec.ImageUrl || '',
      ownerEmail: ownerEmail,
      slug: rec.slug || rec.Slug || '',
      status: rec.status || rec.Status || 'Active',
      affiliateInterest: formattedAffiliate,
      allBusinesses: allBusinesses
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}