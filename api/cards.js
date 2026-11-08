import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qswifsfqyufdjhunvwze.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase.from('Cards').select('*');

    if (error) {
      return res.status(200).json([]);
    }

    // Normalize records to match script.js expectations (imageUrl, Title, url)
    const cards = (data || []).map((item) => {
      // Handle image extraction from Airtable-style string or direct column
      let imgUrl = item.Images || item.images || item.Image || '';
      if (typeof imgUrl === 'string' && imgUrl.includes('(')) {
        const match = imgUrl.match(/\(([^)]+)\)/);
        if (match) imgUrl = match[1];
      }

      return {
        id: String(item.id || item.ID || ''),
        Partner: item.Partner || item.partner || '',
        Title: item.Title || item.title || '',
        imageUrl: imgUrl.trim(),
        url: item.Links || item.links || item.URL || ''
      };
    });

    return res.status(200).json(cards);
  } catch (err) {
    return res.status(200).json([]);
  }
}