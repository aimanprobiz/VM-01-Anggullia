export default async function handler(req, res) {
  // 1. Cache response on Vercel Edge for fast performance & lower Airtable API usage
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');

  const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable credentials are not configured' });
  }

  try {
    let allRecords = [];
    let offset = '';

    // 2. Loop through all pages until every business is fetched
    do {
      const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Businesses`);
      if (offset) url.searchParams.set('offset', offset);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data from Airtable');
      }

      const data = await response.json();
      allRecords = allRecords.concat(data.records || []);
      
      // If there are more than 100 items, Airtable returns an 'offset' token for the next page
      offset = data.offset || '';
    } while (offset);

    // 3. Clean and return the list
    const businesses = allRecords.map(record => ({
      id: record.id,
      ...record.fields
    }));

    return res.status(200).json(businesses);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to load business listings' });
  }
}
