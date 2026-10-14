export default async function handler(req, res) {
  // Matching your exact Vercel Environment Variable names: AIRTABLE_PAT & AIRTABLE_BASE_ID
  const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable credentials are not configured' });
  }

  try {
    // Fetch directly from your "Businesses" table in Airtable
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Businesses`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data from Airtable');
    }

    const data = await response.json();
    
    // Clean and flatten Airtable's record structure
    const businesses = data.records.map(record => ({
      id: record.id,
      ...record.fields
    }));

    return res.status(200).json(businesses);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to load business listings' });
  }
}
