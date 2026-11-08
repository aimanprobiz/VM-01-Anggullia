// api/update-business.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recordId, token, name, subtitle, category, description, phone, websiteUrl, instagramUrl, tiktokUrl, imageUrl, affiliateInterest } = req.body || {};

  if (!recordId && !token) {
    return res.status(400).json({ error: 'Record ID or token is required.' });
  }

  const SUPABASE_URL = 'https://qswifsfqyufdjhunvwze.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials missing.' });
  }

  try {
    // Build update payload matching your exact capitalized Supabase column names
    const updateData = {};
    if (name !== undefined) updateData.Name = name;
    if (subtitle !== undefined) updateData.Subtitle = subtitle;
    if (category !== undefined) updateData.Category = category;
    if (description !== undefined) updateData.Description = description;
    if (phone !== undefined) updateData.Phone = phone;
    if (websiteUrl !== undefined) updateData.WebsiteUrl = websiteUrl;
    if (instagramUrl !== undefined) updateData.InstagramUrl = instagramUrl;
    if (tiktokUrl !== undefined) updateData.TiktokUrl = tiktokUrl;
    if (imageUrl !== undefined) updateData.ImageUrl = imageUrl;
    if (affiliateInterest !== undefined) updateData.AffiliateInterest = affiliateInterest;

    let queryParam = recordId ? `id=eq.${encodeURIComponent(recordId)}` : `EditToken=eq.${encodeURIComponent(token)}`;

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/Businesses?${queryParam}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to update database record.', details: result });
    }

    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}