import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qswifsfqyufdjhunvwze.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase.from('Businesses').select('*');

    if (error) {
      return res.status(200).json({ records: [], supabaseError: error });
    }

    const records = (data || []).map((item, index) => {
      // Standardize fields to ensure front-end receives expected object format
      const fields = {};
      Object.keys(item).forEach(key => {
        fields[key] = item[key];
        // Also provide lowercase property alias just in case script.js references them in lowercase
        fields[key.toLowerCase()] = item[key];
      });

      return {
        id: String(item.id || item.ID || index + 1),
        fields: {
          ...fields,
          // Ensure essential UI fields exist
          Name: item.Name || item.name || '',
          Category: item.Category || item.category || 'General',
          Status: item.Status || item.status || 'Active',
          ImageURL: item.ImageURL || item.imageurl || item.Image || '',
          SubTitle: item.SubTitle || item.subtitle || '',
          Deal: item.Deal || item.deal || ''
        }
      };
    });

    return res.status(200).json({ records });
  } catch (err) {
    return res.status(200).json({ records: [], caughtError: err.message });
  }
}