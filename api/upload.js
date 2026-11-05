// api/upload.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb', // Allows up to 5MB image files + base64 overhead
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileData } = req.body; // Base64 image string from frontend

    if (!fileData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Upload image to Cloudinary with auto-optimization and resizing
    const uploadResponse = await cloudinary.uploader.upload(fileData, {
      folder: 'dailybarakah_vendors',
      transformation: [
        { width: 1200, crop: 'limit' }, // Cap maximum width to keep images lightweight
        { quality: 'auto', fetch_format: 'auto' } // Automatically convert & compress for web
      ]
    });

    // Return the clean public URL back to your frontend!
    return res.status(200).json({ 
      success: true, 
      url: uploadResponse.secure_url 
    });

  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({ error: 'Failed to upload image to cloud storage.' });
  }
}
