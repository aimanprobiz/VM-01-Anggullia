export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, action } = req.body || {};

  if (!slug) {
    return res.status(400).json({ error: 'Missing business slug' });
  }

  // 1. Sanitize slug input to safely handle special characters & quotes
  const cleanSlug = String(slug).replace(/['"\\]/g, '').trim().toLowerCase();

  const AIRTABLE_PAT = process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY; 
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTAB_BASE_ID || process.env.AIRTABLE_BASE; 
  const TABLE_NAME = 'Businesses';

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Environment variables not configured properly in Vercel' });
  }

  try {
    // 2. Use case-insensitive formula matching with clean input
    const filter = encodeURIComponent(`LOWER({Slug})='${cleanSlug}'`);
    const queryUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${filter}`;

    const queryResponse = await fetch(queryUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` }
    });

    const queryData = await queryResponse.json();

    if (!queryResponse.ok || !queryData.records || queryData.records.length === 0) {
      return res.status(404).json({ error: `Business record not found for slug: ${cleanSlug}` });
    }

    const record = queryData.records[0];
    const recordId = record.id;
    
    // 3. Clean action mapping
    const actionMap = {
      whatsapp: 'WhatsAppClicks',
      code: 'CodeClicks',
      copy: 'CodeCopies',
      website: 'WebsiteClicks',
      instagram: 'InstagramClicks',
      tiktok: 'TikTokClicks',
      social_whatsapp: 'SocialWhatsAppClicks',
      claim: 'RedemptionsCount',
      report: 'ReportCount' // <-- Add this new mapping
    };

    const fieldToUpdate = actionMap[action] || 'RedemptionsCount';
    const currentCount = Number(record.fields[fieldToUpdate] || 0);
    const newCount = currentCount + 1;

    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            [fieldToUpdate]: newCount
          }
        })
      }
    );

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      return res.status(500).json({ error: 'Failed to update Airtable record', details: updateData });
    }

    return res.status(200).json({
      success: true,
      action: action || 'claim',
      fieldUpdated: fieldToUpdate,
      count: newCount
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
