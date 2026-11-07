// api/register.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name,
    subtitle,
    category,
    description,
    phone,
    websiteUrl,
    instagramUrl,
    tiktokUrl,
    imageUrl,
    ownerEmail,
    affiliateInterest
  } = req.body || {};

  if (!name || !ownerEmail) {
    return res.status(400).json({ error: 'Missing required fields (Business Name or Owner Email).' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured properly in Vercel' });
  }

  try {
    const editToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const formattedAffiliateInterest = (affiliateInterest === 'Yes') ? 'Yes - Interested' : 'No - Standard Listing';
    const generatedSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const fieldsToSave = {
      name: name.trim(),
      owner_email: ownerEmail.trim().toLowerCase(),
      status: 'Pending',
      edit_token: editToken,
      affiliate_interest: formattedAffiliateInterest,
      slug: generatedSlug
    };

    if (category && category.trim()) fieldsToSave.category = category.trim();
    if (subtitle && subtitle.trim()) fieldsToSave.subtitle = subtitle.trim();
    if (description && description.trim()) fieldsToSave.description = description.trim();
    if (phone && phone.trim()) fieldsToSave.phone = phone.trim();
    if (websiteUrl && websiteUrl.trim()) fieldsToSave.website_url = websiteUrl.trim();
    if (instagramUrl && instagramUrl.trim()) fieldsToSave.instagram_url = instagramUrl.trim();
    if (tiktokUrl && tiktokUrl.trim()) fieldsToSave.tiktok_url = tiktokUrl.trim();
    if (imageUrl && imageUrl.trim()) fieldsToSave.image_url = imageUrl.trim();

    const response = await fetch(`${SUPABASE_URL}/rest/v1/businesses`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(fieldsToSave)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to create business record in Supabase', details: data });
    }

    return res.status(200).json({
      success: true,
      message: 'Business submitted successfully! Pending admin approval.'
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}