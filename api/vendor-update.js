// api/vendor-update.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, fieldsToUpdate } = req.body || {};

  if (!token || !fieldsToUpdate) {
    return res.status(400).json({ error: 'Missing token or update fields.' });
  }

  const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = 'Businesses';

  try {
    // 1. Verify token first
    const filter = encodeURIComponent(`{EditToken}='${token.trim()}'`);
    const queryUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${filter}`;

    const queryResponse = await fetch(queryUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` }
    });

    const queryData = await queryResponse.json();

    if (!queryResponse.ok || !queryData.records || queryData.records.length === 0) {
      return res.status(404).json({ error: 'Unauthorized: Invalid token.' });
    }

    const recordId = queryData.records[0].id;

    // 2. Perform update
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: fieldsToUpdate })
      }
    );

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      return res.status(500).json({ error: 'Failed to update Airtable record', details: updateData });
    }

    return res.status(200).json({ success: true, message: 'Profile updated successfully!' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
