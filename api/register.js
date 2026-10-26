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

  // Check all possible environment variable names to prevent 500 error
  const AIRTABLE_PAT = process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY; 
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTAB_BASE_ID || process.env.AIRTABLE_BASE; 
  const TABLE_NAME = 'Businesses';

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable credentials not configured properly in Vercel' });
  }

  try {
    // Generate a clean slug and edit token safely
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const editToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          Name: name.trim(),
          SubTitle: subtitle ? subtitle.trim() : '',
          Category: category.trim(),
          Description: description ? description.trim() : '',
          Deal: deal ? deal.trim() : '',
          ActionType: actionType ? actionType.toLowerCase().trim() : 'whatsapp',
          PromoCode: promoCode ? promoCode.trim() : '',
          Phone: phone ? phone.trim() : '',
          WebsiteURL: websiteUrl ? websiteUrl.trim() : '',
          InstagramURL: instagramUrl ? instagramUrl.trim() : '',
          TikTokURL: tiktokUrl ? tiktokUrl.trim() : '',
          ImageURL: imageUrl ? imageUrl.trim() : 'https://lh3.googleusercontent.com/d/1MBk6pIwDCG0NH9bh9lD7EY9kAp4IQiNM',
          OwnerEmail: ownerEmail.trim().toLowerCase(),
          Status: 'Pending',
          EditToken: editToken,
          Slug: slug
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to create business record in Airtable', details: data });
    }

    return res.status(200).json({
      success: true,
      slug: slug,
      message: 'Business submitted successfully! Pending admin approval.'
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
