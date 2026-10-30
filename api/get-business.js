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
    // 1. Fetch current business record by token
    const formula = encodeURIComponent(`{EditToken} = '${token.trim()}'`);
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${formula}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired edit session.' });
    }

    const currentRecord = data.records[0];
    const fields = currentRecord.fields;
    const ownerEmail = (fields.OwnerEmail || '').trim().toLowerCase();

    // 2. Fetch all businesses matching this OwnerEmail to enable multi-listing switching
    let allBusinesses = [];
    if (ownerEmail) {
      const allFormula = encodeURIComponent(`LOWER({OwnerEmail}) = '${ownerEmail}'`);
      const allRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${allFormula}`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
        }
      );
      const allData = await allRes.json();
      if (allRes.ok && allData.records) {
        allBusinesses = allData.records.map(r => ({
          id: r.id,
          name: r.fields.Name || 'Unnamed Business',
          token: r.fields.EditToken
        })).filter(b => b.token);
      }
    }

    // Map Airtable's "Affiliate Interest" selection to short form ('Yes' or 'No') for the radio buttons
    let rawAffiliate = fields["Affiliate Interest"] || 'No';
    let formattedAffiliate = rawAffiliate.toLowerCase().startsWith('yes') ? 'Yes' : 'No';

    return res.status(200).json({
      recordId: currentRecord.id,
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
      slug: fields.Slug || '',
      status: fields.Status || 'Pending',
      affiliateInterest: formattedAffiliate, // <-- Fixed: Added this back!
      allBusinesses: allBusinesses
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
