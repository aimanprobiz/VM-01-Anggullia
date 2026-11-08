import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qswifsfqyufdjhunvwze.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase.from('Businesses').select('*');

    if (error) {
      return res.status(200).json([]);
    }

    // Filter for Active businesses and normalize fields
    const activeBusinesses = (data || [])
      .filter(item => {
        const status = item.Status || item.status || 'Active';
        return status.toLowerCase() === 'active';
      })
      .map((item, index) => ({
        id: String(item.id || item.ID || index + 1),
        Name: item.Name || item.name || '',
        Category: item.Category || item.category || 'General',
        ImageURL: item.ImageURL || item.imageurl || item.Image || '',
        SubTitle: item.SubTitle || item.subtitle || '',
        Deal: item.Deal || item.deal || '',
        Slug: item.Slug || item.slug || '',
        Description: item.Description || item.description || '',
        IsFeatured: item.IsFeatured || item.isfeatured || false,
        Status: 'Active'
      }));

    return res.status(200).json(activeBusinesses);
  } catch (err) {
    return res.status(200).json([]);
  }
}