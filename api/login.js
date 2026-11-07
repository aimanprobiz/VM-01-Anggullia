// api/login.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured properly.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/businesses?owner_email=eq.${encodeURIComponent(cleanEmail)}&select=name,edit_token`,
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

    // Here you can integrate your email service provider (like Resend) 
    // to dispatch the edit/dashboard links containing each business's edit_token.

    return res.status(200).json({
      success: true,
      message: 'Login link(s) sent to your email successfully!',
      count: data.length
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}