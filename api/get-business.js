// api/get-business.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed: Expected GET request.' });
  }

  const { token } = req.query;

  if (!token || !token.trim()) {
    return res.status(400).json({ success: false, error: 'Debug Error: Edit token is missing from the request URL.' });
  }

  const SUPABASE_URL = 'https://qswifsfqyufdjhunvwze.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_KEY) {
    return res.status(500).json({ success: false, error: 'Debug Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not configured on Vercel.' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const cleanToken = token.trim();

    // Query Supabase using 'Businesses' (capital B) to match your database schema
    const { data, error } = await supabase
      .from('Businesses')
      .select('*')
      .eq('edit_token', cleanToken);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ success: false, error: `Database Error: ${error.message}` });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, error: `Debug Error: No business record found matching token: "${cleanToken}".` });
    }

    const rec = data[0];
    const recId = rec.id || rec.ID || '';
    const ownerEmail = (rec.owner_email || rec.OwnerEmail || '').trim().toLowerCase();

    // Fetch all associated businesses if owner email exists
    let allBusinesses = [];
    if (ownerEmail) {
      const { data: allData, error: allError } = await supabase
        .from('Businesses')
        .select('*')
        .eq('owner_email', ownerEmail);

      if (!allError && allData) {
        allBusinesses = allData.map(r => ({
          id: r.id || r.ID || '',
          name: r.name || r.Name || 'Unnamed Business',
          token: r.edit_token || r.EditToken || ''
        })).filter(b => b.token);
      }
    }

    const rawAffiliate = String(rec.affiliate_interest || rec.AffiliateInterest || 'No');
    const formattedAffiliate = rawAffiliate.toLowerCase().startsWith('yes') ? 'Yes' : 'No';

    return res.status(200).json({
      success: true,
      recordId: recId,
      id: recId,
      name: rec.name || rec.Name || '',
      subtitle: rec.subtitle || rec.Subtitle || '',
      category: rec.category || rec.Category || '',
      description: rec.description || rec.Description || '',
      phone: rec.phone || rec.Phone || '',
      websiteUrl: rec.website_url || rec.WebsiteUrl || '',
      instagramUrl: rec.instagram_url || rec.InstagramUrl || '',
      tiktokUrl: rec.tiktok_url || rec.TiktokUrl || '',
      imageUrl: rec.image_url || rec.ImageUrl || '',
      ownerEmail: ownerEmail,
      slug: rec.slug || rec.Slug || '',
      status: rec.status || rec.Status || 'Active',
      affiliateInterest: formattedAffiliate,
      allBusinesses: allBusinesses
    });

  } catch (err) {
    console.error('Unexpected server exception in get-business:', err);
    return res.status(500).json({ success: false, error: `Server Exception: ${err.message}` });
  }
}