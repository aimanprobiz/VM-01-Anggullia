import { Resend } from 'resend';

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

    // Initialize Resend
    const resend = new Resend(RESEND_API_KEY);

    // Build links list for the email
    const linksHtml = data.map(biz => {
      const token = biz.EditToken || '';
      const loginUrl = `https://vm-ang.vercel.app/edit.html?token=${token}`;
      return `<p><strong>${biz.Name}</strong><br><a href="${loginUrl}" target="_blank">Manage Business Dashboard</a></p>`;
    }).join('<br>');

    // Send the email via Resend
    await resend.emails.send({
      from: 'DailyBarakah SG <onboarding@resend.dev>', // or your verified domain sender
      to: [cleanEmail],
      subject: 'Your DailyBarakah Vendor Access Links',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #0f382c;">Assalaamualaikum,</h2>
          <p>Here are your secure access links to manage your registered businesses on DailyBarakah SG:</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
          ${linksHtml}
          <p style="margin-top: 20px; font-size: 0.85rem; color: #666;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Login link(s) sent to your email successfully!',
      count: data.length
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}