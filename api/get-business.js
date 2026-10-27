// api/get-business.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || !token.trim()) {
    return res.status(400).json({ error: 'Edit token is required.' });
  }

  const AIRTABLE_PAT = process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTAB_BASE_ID || process.env.AIRTABLE_BASE;
  const TABLE_NAME = 'Businesses';

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable credentials not configured properly.' });
  }

  try {
    // Search Airtable for matching EditToken
    const formula = encodeURIComponent(`{EditToken} = '${token.trim()}'`);
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${formula}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch business record.', details: data });
    }

    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired edit session.' });
    }

    const record = data.records[0];
    const fields = record.fields;

    // Return exact field mapping expected by edit.html
    return res.status(200).json({
      recordId: record.id,
      name: fields.Name || '',
      subtitle: fields.SubTitle || '',
      category: fields.Category || '',
      description: fields.Description || '',
      deal: fields.Deal || '',
      actionType: fields.ActionType || 'Enquire',
      promoCode: fields.PromoCode || '',
      phone: fields.Phone || '',
      websiteUrl: fields.WebsiteURL || '',
      instagramUrl: fields.InstagramURL || '',
      tiktokUrl: fields.TikTokURL || '',
      imageUrl: fields.ImageURL || '',
      ownerEmail: fields.OwnerEmail || '',
      status: fields.Status || 'Pending'
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
