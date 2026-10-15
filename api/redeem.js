export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.body || {};

  if (!slug) {
    return res.status(400).json({ error: 'Missing business slug' });
  }

  // Fallbacks for variable names in Vercel
  const AIRTABLE_API_KEY = process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY; 
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTAB_BASE_ID || process.env.AIRTABLE_BASE; 
  const TABLE_NAME = 'Businesses';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable keys:', { AIRTABLE_API_KEY: !!AIRTABLE_API_KEY, AIRTABLE_BASE_ID: !!AIRTABLE_BASE_ID });
    return res.status(500).json({ error: 'Environment variables not configured properly in Vercel' });
  }

  try {
    // 1. Query Airtable for the record
    const filter = encodeURIComponent(`{Slug}='${slug}'`);
    const queryUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${filter}`;

    const queryResponse = await fetch(queryUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });

    const queryData = await queryResponse.json();

    if (!queryResponse.ok) {
      console.error('Airtable Query Error:', queryData);
      return res.status(500).json({ error: 'Airtable read failed', details: queryData });
    }

    if (!queryData.records || queryData.records.length === 0) {
      console.error(`No record found in Airtable for slug: ${slug}`);
      return res.status(404).json({ error: `Business record not found for slug: ${slug}` });
    }

    const record = queryData.records[0];
    const recordId = record.id;
    
    // Get current count (default to 0 if empty)
    const currentCount = Number(record.fields.RedemptionsCount || 0);
    const newCount = currentCount + 1;

    // 2. Update the record with the incremented count
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            "RedemptionsCount": newCount
          }
        })
      }
    );

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      console.error('Airtable Update Error:', updateData);
      return res.status(500).json({ error: 'Failed to update Airtable record', details: updateData });
    }

    return res.status(200).json({ success: true, count: newCount });
  } catch (error) {
    console.error('Error updating redemption count:', error);
    return res.status(500).json({ error: error.message });
  }
}
