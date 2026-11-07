// api/update-business.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    token,
    name,
    subtitle,
    category,
    description,
    phone,
    websiteUrl,
    instagramUrl,
    tiktokUrl,
    imageUrl,
    affiliateInterest
  } = req.body || {};

  if (!token || !token.trim()) {
    return res.status(400).json({ error: 'Authentication token is required.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured properly.' });
  }

  try {
    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name.trim();
    if (subtitle !== undefined) fieldsToUpdate.subtitle = subtitle.trim();
    if (category !== undefined) fieldsToUpdate.category = category.trim();
    if (description !== undefined) fieldsToUpdate.description = description.trim();
    if (phone !== undefined) fieldsToUpdate.phone = phone.trim();
    if (websiteUrl !== undefined) fieldsToUpdate.website_url = websiteUrl.trim();
    if (instagramUrl !== undefined) fieldsToUpdate.instagram_url = instagramUrl.trim();
    if (tiktokUrl !== undefined) fieldsToUpdate.tiktok_url = tiktokUrl.trim();
    if (imageUrl !== undefined) fieldsToUpdate.image_url = imageUrl.trim();
    
    if (affiliateInterest !== undefined) {
      fieldsToUpdate.affiliate_interest = (affiliateInterest === 'Yes') ? 'Yes - Interested' : 'No - Standard Listing';
    }

    if (name !== undefined) {
      fieldsToUpdate.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/businesses?edit_token=eq.${encodeURIComponent(token.trim())}`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(fieldsToUpdate)
      }
    );

    const data = await response.json();

    if (!response.ok || !data || data.length === 0) {
      return res.status(404).json({ error: 'Failed to update business or invalid token.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Business listing updated successfully!'
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}