import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qswifsfqyufdjhunvwze.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase.from('businesses').select('*');

    if (error) {
      return res.status(200).json({ records: [], supabaseError: error });
    }

    const records = Array.isArray(data) ? data.map((item, index) => ({
      id: String(item.id || item.ID || index + 1),
      fields: item
    })) : [];

    return res.status(200).json({ records });
  } catch (err) {
    return res.status(200).json({ records: [], caughtError: err.message });
  }
}