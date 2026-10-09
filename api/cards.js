export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = 'Cards';

  try {
    // Added the sorting query parameters to the end of the URL here:
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?sort[0][field]=Order&sort[0][direction]=asc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
        },
      }
    );
    
    const data = await response.json();

    // Catch Airtable API errors (401, 404, etc.)
    if (!response.ok) {
      return res.status(response.status).json({ airtableError: data });
    }

const cards = data.records.map((record) => {
      const attachments = record.fields.Images;
      return {
        id: record.id,
        imageUrl: attachments && attachments[0] ? attachments[0].url : '',
        Title: record.fields.Title || '', // <-- Add this line here
      };
    });

    return res.status(200).json(cards);
  } catch (error) {
    return res.status(500).json({ caughtError: error.message });
  }
}
