import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUDINARY_CLOUD_NAME',
  api_key: process.env.CLOUDINARY_API_KEY || 'YOUR_CLOUDINARY_API_KEY',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YOUR_CLOUDINARY_API_SECRET',
});

// Configure Multer to use memory storage (so we can pass buffer directly to Cloudinary)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided.' });
      return;
    }

    // Upload to Cloudinary using upload_stream
    const uploadToCloudinary = () => {
      return new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'tailor_saas_app' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        stream.end(req.file!.buffer);
      });
    };

    const result = await uploadToCloudinary();

    res.status(200).json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error('[Upload Controller] Cloudinary upload error:', error);
    res.status(500).json({ success: false, message: 'Image upload failed.' });
  }
};
