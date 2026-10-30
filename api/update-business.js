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

  if (!recordId || !token) {
    return res.status(400).json({ error: 'Missing record ID or security token.' });
  }

  if (!name || !category) {
    return res.status(400).json({ error: 'Business Name and Category are required.' });
  }

  const AIRTABLE_PAT = process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTAB_BASE_ID || process.env.AIRTABLE_BASE;
  const TABLE_NAME = 'Businesses';

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable credentials not configured properly.' });
  }

  try {
    // 1. Verify token matches recordId before updating for security
    const checkRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${recordId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
    });
    
    const checkData = await checkRes.json();
    if (!checkRes.ok || !checkData.fields || checkData.fields.EditToken !== token) {
      return res.status(403).json({ error: 'Unauthorized edit request.' });
    }

    // 2. Map incoming interest selection to exact Airtable Single Select options
    const formattedAffiliateInterest = (affiliateInterest === 'Yes') ? 'Yes - Interested' : 'No - Standard Listing';

    // 3. Prepare field updates with exact Airtable casing
    const fieldsToUpdate = {
      Name: name.trim(),
      Category: category.trim(),
      SubTitle: subtitle ? subtitle.trim() : '',
      Description: description ? description.trim() : '',
      Phone: phone ? phone.trim() : '',
      WebsiteURL: websiteUrl ? websiteUrl.trim() : '',
      InstagramURL: instagramUrl ? instagramUrl.trim() : '',
      TikTokURL: tiktokUrl ? tiktokUrl.trim() : '',
      ImageURL: imageUrl ? imageUrl.trim() : '',
      "Affiliate Interest": formattedAffiliateInterest
    };

    // 4. Update row in Airtable
    const updateRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${recordId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: fieldsToUpdate })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      return res.status(500).json({ error: 'Failed to record update in Airtable.', details: updateData });
    }

    return res.status(200).json({
      success: true,
      message: 'Business profile updated successfully!'
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
