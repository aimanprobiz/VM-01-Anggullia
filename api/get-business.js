// api/get-business.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || !token.trim()) {
    return res.status(400).json({ error: 'Edit token is required.' });
  }

  const SUPABASE_URL = 'https://qswifsfqyufdjhunvwze.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase service role key not configured.' });
  }

  try {
    // Query using exact capitalized column name "EditToken"
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/Businesses?EditToken=eq.${encodeURIComponent(token.trim())}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data || data.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired edit session.' });
    }

    const currentRecord = data[0];
    const ownerEmail = (currentRecord.OwnerEmail || '').trim().toLowerCase();

    let allBusinesses = [];
    if (ownerEmail) {
      const allRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Businesses?OwnerEmail=eq.${encodeURIComponent(ownerEmail)}&select=id,Name,EditToken`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const allData = await allRes.json();
      if (allRes.ok && allData) {
        allBusinesses = allData.map(r => ({
          id: r.id,
          name: r.Name || 'Unnamed Business',
          token: r.EditToken
        })).filter(b => b.token);
      }
    }

    let rawAffiliate = currentRecord.AffiliateInterest || 'No';
    let formattedAffiliate = rawAffiliate.toLowerCase().startsWith('yes') ? 'Yes' : 'No';

    return res.status(200).json({
      recordId: currentRecord.id,
      name: currentRecord.Name || '',
      subtitle: currentRecord.Subtitle || '',
      category: currentRecord.Category || '',
      description: currentRecord.Description || '',
      phone: currentRecord.Phone || '',
      websiteUrl: currentRecord.WebsiteUrl || '',
      instagramUrl: currentRecord.InstagramUrl || '',
      tiktokUrl: currentRecord.TiktokUrl || '',
      imageUrl: currentRecord.ImageUrl || '',
      ownerEmail: currentRecord.OwnerEmail || '',
      slug: currentRecord.Slug || '',
      status: currentRecord.Status || 'Pending',
      affiliateInterest: formattedAffiliate,
      allBusinesses: allBusinesses
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}