// api/login.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Please enter your registered email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  const AIRTABLE_PAT = process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTAB_BASE_ID || process.env.AIRTABLE_BASE;
  const TABLE_NAME = 'Businesses';

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable credentials not configured properly.' });
  }

  try {
    const formula = encodeURIComponent(`LOWER({OwnerEmail}) = '${cleanEmail}'`);
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${formula}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to query Airtable.', details: data });
    }

    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ 
        error: 'No business listing found registered under this email address.' 
      });
    }

    // Process all matching records and ensure every record has an EditToken
    const businesses = await Promise.all(data.records.map(async (record) => {
      let editToken = record.fields.EditToken;

      if (!editToken) {
        editToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${record.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${AIRTABLE_PAT}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fields: { EditToken: editToken } })
        });
      }

      return {
        id: record.id,
        name: record.fields.Name || 'Unnamed Business',
        token: editToken
      };
    }));

    return res.status(200).json({
      success: true,
      businesses: businesses // Return array of all listings
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
