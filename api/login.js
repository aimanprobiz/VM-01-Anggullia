export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const SUPABASE_URL = 'https://qswifsfqyufdjhunvwze.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!SUPABASE_KEY || !RESEND_API_KEY) {
    return res.status(500).json({ error: 'Server configuration keys missing.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // Query businesses matching the owner email
    const sbResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/Businesses?OwnerEmail=eq.${encodeURIComponent(cleanEmail)}&select=Name,EditToken`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const data = await sbResponse.json();

    if (!sbResponse.ok || !data || data.length === 0) {
      return res.status(404).json({ error: 'No businesses found registered with this email.' });
    }

    // Build the primary edit token URL (uses first business's token)
    const primaryToken = data[0].EditToken || '';
    const magicLink = `https://vm-ang.vercel.app/edit.html?token=${primaryToken}`;

    // Format list of associated business names
    const bizListItems = data.map(biz => `<li style="margin-bottom: 4px;">• ${biz.Name}</li>`).join('');

    // HTML Email Template matching the original design
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 40px 10px; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e1e8ed; border-radius: 16px; padding: 32px 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
          h2 { color: #0f382c; font-size: 1.3rem; font-weight: 700; margin-top: 0; margin-bottom: 12px; }
          p { color: #555555; font-size: 0.92rem; line-height: 1.5; margin-bottom: 20px; }
          .biz-box { background-color: #f2f8f5; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; }
          .biz-box-title { font-size: 0.85rem; font-weight: 700; color: #0f382c; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
          .biz-list { list-style: none; padding: 0; margin: 0; font-size: 0.9rem; color: #333333; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { background-color: #0f382c; color: #ffffff !important; font-weight: 700; font-size: 0.95rem; text-decoration: none; padding: 14px 32px; border-radius: 10px; display: inline-block; box-shadow: 0 2px 6px rgba(15, 56, 44, 0.2); }
          .footer-text { font-size: 0.78rem; color: #888888; line-height: 1.4; border-top: 1px solid #eeeeee; padding-top: 16px; margin-top: 24px; }
          .link-fallback { font-size: 0.75rem; color: #888888; word-break: break-all; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Assalamu Alaikum!</h2>
          <p>Here is your secure access link for managing your listing(s) on <strong>DailyBarakah SG</strong>:</p>
          
          <div class="biz-box">
            <div class="biz-box-title">Associated Business(es):</div>
            <ul class="biz-list">
              ${bizListItems}
            </ul>
          </div>

          <div class="btn-container">
            <a href="${magicLink}" class="btn" target="_blank">Log In to Vendor Portal</a>
          </div>

          <div class="footer-text">
            If you did not request this email, you can safely ignore it.<br>
            Or copy paste this link into your browser:
            <div class="link-fallback">${magicLink}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'DailyBarakah SG <onboarding@resend.dev>',
        to: [cleanEmail],
        subject: 'Your Magic Login Link - DailyBarakah SG Vendor Portal',
        html: emailHtml
      })
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      return res.status(500).json({ error: resendResult.message || 'Failed to dispatch email via Resend.' });
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