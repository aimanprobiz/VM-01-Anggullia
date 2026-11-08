// api/get-business.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || !token.trim()) {
    return res.status(400).json({ error: 'Edit token is required.' });
  }

  const SUPABASE_URL = 'https://qswifsfqyufdjhunvwze.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured.' });
  }

  try {
    const cleanToken = token.trim();

    // Query Business record by EditToken
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/Businesses?EditToken=eq.${encodeURIComponent(cleanToken)}&select=*`,
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

    const rec = data[0];
    const ownerEmail = (rec.OwnerEmail || rec.owner_email || '').trim().toLowerCase();

    let allBusinesses = [];
    if (ownerEmail) {
      try {
        const allRes = await fetch(
          `${SUPABASE_URL}/rest/v1/Businesses?OwnerEmail=eq.${encodeURIComponent(ownerEmail)}&select=id,Name,EditToken`,
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
            id: r.id,
            name: r.Name || r.name || 'Unnamed Business',
            token: r.EditToken || r.edit_token || ''
          })).filter(b => b.token);
        }
      } catch (e) {
        // Fallback silently if fetching other businesses fails
        allBusinesses = [];
      }
    }

    const rawAffiliate = String(rec.AffiliateInterest || rec.affiliate_interest || 'No');
    const formattedAffiliate = rawAffiliate.toLowerCase().startsWith('yes') ? 'Yes' : 'No';

    return res.status(200).json({
      recordId: rec.id,
      name: rec.Name || rec.name || '',
      subtitle: rec.Subtitle || rec.subtitle || '',
      category: rec.Category || rec.category || '',
      description: rec.Description || rec.description || '',
      phone: rec.Phone || rec.phone || '',
      websiteUrl: rec.WebsiteUrl || rec.website_url || '',
      instagramUrl: rec.InstagramUrl || rec.instagram_url || '',
      tiktokUrl: rec.TiktokUrl || rec.tiktok_url || '',
      imageUrl: rec.ImageUrl || rec.image_url || '',
      ownerEmail: rec.OwnerEmail || rec.owner_email || '',
      slug: rec.Slug || rec.slug || '',
      status: rec.Status || rec.status || 'Pending',
      affiliateInterest: formattedAffiliate,
      allBusinesses: allBusinesses
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}