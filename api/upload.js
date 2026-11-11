// api/upload.js
import { v2 as cloudinary } from 'cloudinary';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        success: false, 
        error: 'Cloudinary environment variables are missing or misconfigured on Vercel.' 
      });
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const { fileData } = req.body;

    if (!fileData) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const uploadResponse = await cloudinary.uploader.upload(fileData, {
      folder: 'dailybarakah_vendors',
      transformation: [
        { width: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    return res.status(200).json({ 
      success: true, 
      url: uploadResponse.secure_url 
    });

  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to upload image to cloud storage.' 
    });
  }
}