export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  // Make sure this matches your table tab name (usually 'Table 1' or 'Cards')
  const TABLE_NAME = 'Cards'; 

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
        },
      }
    );

    const data = await response.json();

    const cards = data.records.map((record) => {
      // Updated to 'Images' (with an 's') to match your Airtable column!
      const attachments = record.fields.Images; 
      return {
        id: record.id,
        imageUrl: attachments && attachments[0] ? attachments[0].url : '',
      };
    });

    return res.status(200).json(cards);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch cards' });
  }
}
