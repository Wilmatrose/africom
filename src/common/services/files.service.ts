import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class FilesService {
  constructor() {
    // Initialize Cloudinary with your environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_API_KEY,
      api_secret: process.env.CLOUD_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image', // Ensure we only upload images
          folder: 'africom_uploads', // Optional: Organize files in a folder
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          // Return the secure URL provided by Cloudinary
          resolve(result.secure_url);
        },
      );

      // Convert the buffer to a stream and pipe it to Cloudinary
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);
      bufferStream.pipe(uploadStream);
    });
  }
}