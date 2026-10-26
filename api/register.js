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
    deal,
    actionType,
    promoCode,
    phone,
    websiteUrl,
    instagramUrl,
    tiktokUrl,
    imageUrl,
    ownerEmail
  } = req.body || {};

  if (!name || !ownerEmail || !category) {
    return res.status(400).json({ error: 'Missing required fields (Business Name, Category, or Owner Email).' });
  }

  const AIRTABLE_PAT = process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY; 
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTAB_BASE_ID || process.env.AIRTABLE_BASE; 
  const TABLE_NAME = 'Businesses';

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable credentials not configured properly in Vercel' });
  }

  try {
    const editToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // 1. Build payload object without 'Slug' (since Airtable computes it automatically)
    const fieldsToSave = {
      Name: name.trim(),
      Category: category.trim(),
      OwnerEmail: ownerEmail.trim().toLowerCase(),
      Status: 'Pending',
      EditToken: editToken,
      ActionType: actionType ? actionType.toLowerCase().trim() : 'whatsapp'
    };

    // 2. Conditionally append optional fields if filled in
    if (subtitle && subtitle.trim()) fieldsToSave.Subtitle = subtitle.trim();
    if (description && description.trim()) fieldsToSave.Description = description.trim();
    if (deal && deal.trim()) fieldsToSave.Deal = deal.trim();
    if (promoCode && promoCode.trim()) fieldsToSave.PromoCode = promoCode.trim();
    if (phone && phone.trim()) fieldsToSave.Phone = phone.trim();
    if (websiteUrl && websiteUrl.trim()) fieldsToSave.WebsiteURL = websiteUrl.trim();
    if (instagramUrl && instagramUrl.trim()) fieldsToSave.InstagramURL = instagramUrl.trim();
    if (tiktokUrl && tiktokUrl.trim()) fieldsToSave.TikTokURL = tiktokUrl.trim();
    if (imageUrl && imageUrl.trim()) fieldsToSave.ImageUrl = imageUrl.trim();

    // 3. Send payload to Airtable
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: fieldsToSave })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to create business record in Airtable', details: data });
    }

    return res.status(200).json({
      success: true,
      message: 'Business submitted successfully! Pending admin approval.'
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
