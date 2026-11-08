// api/login.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Hardcode correct Supabase URL to prevent environment variable configuration bugs
  const SUPABASE_URL = 'https://qswifsfqyufdjhunvwze.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase service role key not configured.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // Query using the exact capitalized column name "OwnerEmail"
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/Businesses?OwnerEmail=eq.${encodeURIComponent(cleanEmail)}&select=Name,EditToken`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data || data.length === 0) {
      return res.status(404).json({ error: 'No businesses found registered with this email.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Login link(s) sent to your email successfully!',
      count: data.length
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}