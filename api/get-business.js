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

    // Query using exact capitalized table 'Businesses' and column 'EditToken'
    const { data, error } = await supabase
      .from('Businesses')
      .select('*')
      .eq('EditToken', cleanToken);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ success: false, error: `Database Error: ${error.message}` });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, error: `Debug Error: No business record found matching token: "${cleanToken}".` });
    }

    const rec = data[0];
    const recId = rec.id || rec.ID || '';
    const ownerEmail = (rec.OwnerEmail || rec.owner_email || '').trim().toLowerCase();

    // Fetch all associated businesses if owner email exists
    let allBusinesses = [];
    if (ownerEmail) {
      const { data: allData, error: allError } = await supabase
        .from('Businesses')
        .select('*')
        .eq('OwnerEmail', ownerEmail);

      if (!allError && allData) {
        allBusinesses = allData.map(r => ({
          id: r.id || r.ID || '',
          name: r.Name || r.name || 'Unnamed Business',
          token: r.EditToken || r.edit_token || ''
        })).filter(b => b.token);
      }
    }

    const rawAffiliate = String(rec.AffiliateInterest || rec.affiliate_interest || 'No');
    const formattedAffiliate = rawAffiliate.toLowerCase().startsWith('yes') ? 'Yes' : 'No';

    return res.status(200).json({
      success: true,
      recordId: recId,
      id: recId,
      name: rec.Name || rec.name || '',
      subtitle: rec.Subtitle || rec.subtitle || '',
      category: rec.Category || rec.category || '',
      description: rec.Description || rec.description || '',
      phone: rec.Phone || rec.phone || '',
      websiteUrl: rec.WebsiteUrl || rec.website_url || '',
      instagramUrl: rec.InstagramUrl || rec.instagram_url || '',
      tiktokUrl: rec.TiktokUrl || rec.tiktok_url || '',
      imageUrl: rec.ImageURL || rec.ImageUrl || rec.image_url || '',
      ownerEmail: ownerEmail,
      slug: rec.Slug || rec.slug || '',
      status: rec.Status || rec.status || 'Active',
      affiliateInterest: formattedAffiliate,
      allBusinesses: allBusinesses
    });

  } catch (err) {
    console.error('Unexpected server exception in get-business:', err);
    return res.status(500).json({ success: false, error: `Server Exception: ${err.message}` });
  }
}