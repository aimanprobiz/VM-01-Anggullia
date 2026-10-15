export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Missing business slug' });
  }

const AIRTABLE_API_KEY = process.env.AIRTABLE_PAT; 
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID; 
  const TABLE_NAME = 'Businesses';

  try {
    // 1. Find the Airtable Record ID using the slug
    const queryResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${encodeURIComponent(`{Slug}='${slug}'`)`,
      {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
      }
    );
    const queryData = await queryResponse.json();

    if (!queryData.records || queryData.records.length === 0) {
      return res.status(404).json({ error: 'Business record not found' });
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

    if (!updateResponse.ok) {
      throw new Error('Failed to update Airtable record');
    }

    return res.status(200).json({ success: true, count: newCount });
  } catch (error) {
    console.error('Error updating redemption count:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
