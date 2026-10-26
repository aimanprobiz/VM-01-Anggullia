// api/vendor-dashboard.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query || {};

  if (!token) {
    return res.status(400).json({ error: 'Missing security edit token.' });
  }

  const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = 'Businesses';

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable credentials not configured on Vercel.' });
  }

  try {
    const filter = encodeURIComponent(`{EditToken}='${token.trim()}'`);
    const queryUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${filter}`;

    const response = await fetch(queryUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` }
    });

    const data = await response.json();

    if (!response.ok || !data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired edit token.' });
    }

    const record = data.records[0];

    return res.status(200).json({
      success: true,
      id: record.id,
      fields: record.fields
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
