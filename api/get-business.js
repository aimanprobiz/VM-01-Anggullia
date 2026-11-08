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
    return res.status(500).json({ error: 'Supabase credentials missing.' });
  }

  try {
    const cleanToken = token.trim();

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

    if (!response.ok || !Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired edit session.' });
    }

    const rec = data[0];
    const recId = rec.id || rec.ID || '';
    const ownerEmail = (rec.OwnerEmail || rec.owner_email || '').trim().toLowerCase();

    let allBusinesses = [];
    if (ownerEmail) {
      try {
        const allRes = await fetch(
          `${SUPABASE_URL}/rest/v1/Businesses?OwnerEmail=eq.${encodeURIComponent(ownerEmail)}&select=*`,
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
            name: r.Name || r.name || 'Unnamed Business',
            token: r.EditToken || r.edit_token || ''
          })).filter(b => b.token);
        }
      } catch (e) {
        allBusinesses = [];
      }
    }

    const rawAffiliate = String(rec.AffiliateInterest || rec.affiliate_interest || 'No');
    const formattedAffiliate = rawAffiliate.toLowerCase().startsWith('yes') ? 'Yes' : 'No';

    const bizNameVal = rec.Name || rec.name || '';
    const bizSubVal = rec.Subtitle || rec.subtitle || '';
    const bizCatVal = rec.Category || rec.category || '';
    const bizDescVal = rec.Description || rec.description || '';
    const bizPhoneVal = rec.Phone || rec.phone || '';
    const bizWebVal = rec.WebsiteUrl || rec.website_url || '';
    const bizIgVal = rec.InstagramUrl || rec.instagram_url || '';
    const bizTtVal = rec.TiktokUrl || rec.tiktok_url || '';
    const bizImgVal = rec.ImageUrl || rec.image_url || '';
    const bizSlugVal = rec.Slug || rec.slug || '';
    const bizStatusVal = rec.Status || rec.status || 'Active';

    return res.status(200).json({
      recordId: recId,
      id: recId,
      name: bizNameVal,
      subtitle: bizSubVal,
      category: bizCatVal,
      description: bizDescVal,
      phone: bizPhoneVal,
      websiteUrl: bizWebVal,
      instagramUrl: bizIgVal,
      tiktokUrl: bizTtVal,
      imageUrl: bizImgVal,
      ownerEmail: ownerEmail,
      slug: bizSlugVal,
      status: bizStatusVal,
      affiliateInterest: formattedAffiliate,
      bizName: bizNameVal,
      bizSub: bizSubVal,
      bizCategory: bizCatVal,
      bizDesc: bizDescVal,
      bizPhone: bizPhoneVal,
      bizWebsite: bizWebVal,
      bizInstagram: bizIgVal,
      bizTiktok: bizTtVal,
      bizImage: bizImgVal,
      bizSlug: bizSlugVal,
      Status: bizStatusVal,
      allBusinesses: allBusinesses
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}