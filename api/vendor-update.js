// api/vendor-update.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, fieldsToUpdate } = req.body || {};

  if (!token || !fieldsToUpdate) {
    return res.status(400).json({ error: 'Missing token or update fields.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qswifsfqyufdjhunvwze.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials missing.' });
  }

  try {
    const cleanToken = token.trim();

    // Map camelCase frontend keys to snake_case Supabase columns if needed
    const mappedFields = {};
    if (fieldsToUpdate.Name !== undefined) mappedFields.name = fieldsToUpdate.Name;
    if (fieldsToUpdate.SubTitle !== undefined) mappedFields.subtitle = fieldsToUpdate.SubTitle;
    if (fieldsToUpdate.Deal !== undefined) mappedFields.deal = fieldsToUpdate.Deal;
    if (fieldsToUpdate.Description !== undefined) mappedFields.description = fieldsToUpdate.Description;
    if (fieldsToUpdate.ImageURL !== undefined) mappedFields.image_url = fieldsToUpdate.ImageURL;

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/businesses?edit_token=eq.${encodeURIComponent(cleanToken)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(mappedFields)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to update record in Supabase', details: data });
    }

    return res.status(200).json({ success: true, message: 'Profile updated successfully!' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}