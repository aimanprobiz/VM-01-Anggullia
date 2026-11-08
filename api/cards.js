import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qswifsfqyufdjhunvwze.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase.from('Cards').select('*');

    if (error) {
      return res.status(200).json({ records: [], supabaseError: error });
    }

    const records = (data || []).map((item, index) => {
      const fields = {};
      Object.keys(item).forEach(key => {
        fields[key] = item[key];
        fields[key.toLowerCase()] = item[key];
      });

      return {
        id: String(item.id || item.ID || index + 1),
        fields: {
          ...fields,
          Title: item.Title || item.title || '',
          Partner: item.Partner || item.partner || '',
          Images: item.Images || item.images || item.Image || ''
        }
      };
    });

    return res.status(200).json({ records });
  } catch (err) {
    return res.status(200).json({ records: [], caughtError: err.message });
  }
}