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
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TABLE_NAME = 'Businesses';

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable credentials not configured properly.' });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Resend API Key is missing in environment variables.' });
  }

  try {
    // 1. Search Airtable for matching OwnerEmail (case-insensitive)
    const formula = encodeURIComponent(`LOWER({OwnerEmail}) = '${cleanEmail}'`);
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${formula}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to query Airtable database.', details: data });
    }

    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ 
        error: 'No business listing found under this email address. Please check your spelling or register a new business.' 
      });
    }

    // 2. Map matching records and ensure an EditToken exists for each
    const businesses = await Promise.all(
      data.records.map(async (record) => {
        let editToken = record.fields.EditToken;

        if (!editToken) {
          editToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
          await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${record.id}`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${AIRTABLE_PAT}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ fields: { EditToken: editToken } })
            }
          );
        }

        return {
          id: record.id,
          name: record.fields.Name || 'Your Business',
          token: editToken
        };
      })
    );

    // 3. Construct the Magic Link URL using the primary business token
    // Determines domain dynamically (works on localhost, vercel domain, or custom domain)
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const magicLink = `${protocol}://${host}/edit.html?token=${businesses[0].token}`;

    const businessNamesList = businesses.map(b => `• ${b.name}`).join('<br>');

    // 4. Send Email via Resend API
    // Note: Resend default free sender is 'onboarding@resend.dev' until you verify a custom domain
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'DailyBarakah SG <onboarding@resend.dev>',
        to: [cleanEmail],
        subject: '🪄 Your Magic Login Link - DailyBarakah SG Vendor Portal',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #064e3b; margin-top: 0;">Assalamu Alaikum!</h2>
            <p style="color: #374151; font-size: 15px; line-height: 1.5;">
              Here is your secure access link for managing your listing(s) on <strong>DailyBarakah SG</strong>:
            </p>
            <div style="background-color: #f7fee7; padding: 12px; border-radius: 8px; margin: 16px 0; color: #166534; font-size: 14px;">
              <strong>Associated Business(es):</strong><br>
              ${businessNamesList}
            </div>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${magicLink}" style="background-color: #064e3b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Log In to Vendor Portal
              </a>
            </div>
            <p style="color: #6b7280; font-size: 12px; line-height: 1.4;">
              If you did not request this email, you can safely ignore it.<br>
              Or copy-paste this link into your browser:<br>
              <a href="${magicLink}" style="color: #059669;">${magicLink}</a>
            </p>
          </div>
        `
      })
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      return res.status(500).json({ error: 'Failed to send login email. Please try again.', details: emailData });
    }

    return res.status(200).json({
      success: true,
      message: 'Magic link email sent successfully!'
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
