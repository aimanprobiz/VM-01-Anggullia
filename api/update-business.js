// api/update-business.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    recordId,
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

  if ((!recordId && !token) || !name) {
    return res.status(400).json({ error: 'Missing required fields (Record ID/Token or Business Name).' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qswifsfqyufdjhunvwze.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials missing.' });
  }

  try {
    const formattedAffiliateInterest = (affiliateInterest === 'Yes') ? 'Yes - Interested' : 'No - Standard Listing';
    const generatedSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const fieldsToUpdate = {
      name: name.trim(),
      slug: generatedSlug,
      affiliate_interest: formattedAffiliateInterest
    };

    if (category !== undefined) fieldsToUpdate.category = category.trim();
    if (subtitle !== undefined) fieldsToUpdate.subtitle = subtitle.trim();
    if (description !== undefined) fieldsToUpdate.description = description.trim();
    if (phone !== undefined) fieldsToUpdate.phone = phone.trim();
    if (websiteUrl !== undefined) fieldsToUpdate.website_url = websiteUrl.trim();
    if (instagramUrl !== undefined) fieldsToUpdate.instagram_url = instagramUrl.trim();
    if (tiktokUrl !== undefined) fieldsToUpdate.tiktok_url = tiktokUrl.trim();
    if (imageUrl !== undefined) fieldsToUpdate.image_url = imageUrl.trim();

    // Query condition: match by record ID or edit_token
    let queryParam = '';
    if (recordId) {
      queryParam = `id=eq.${encodeURIComponent(recordId)}`;
    } else {
      queryParam = `edit_token=eq.${encodeURIComponent(token.trim())}`;
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/businesses?${queryParam}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(fieldsToUpdate)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to update business in Supabase', details: data });
    }

    return res.status(200).json({
      success: true,
      message: 'Listing updated successfully!'
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}