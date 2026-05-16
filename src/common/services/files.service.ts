import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import 'multer'; // For Express.Multer.File types

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

  // =========================
  // IMAGE UPLOAD
  // =========================
  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'africom_uploads',
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Image upload failed: No result from Cloudinary'));
          resolve(result.secure_url);
        },
      );

      this.getStreamFromBuffer(file).pipe(uploadStream);
    });
  }

  // =========================
  // VIDEO UPLOAD
  // =========================
  async uploadVideo(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video', // CRITICAL: Tells Cloudinary to treat this as a video
          folder: 'africom_uploads_videos',
          chunk_size: 600000, // Recommended for larger videos to prevent timeouts
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Video upload failed: No result from Cloudinary'));
          resolve(result.secure_url);
        },
      );

      this.getStreamFromBuffer(file).pipe(uploadStream);
    });
  }

  // =========================
  // HELPER: CONVERT BUFFER TO STREAM
  // =========================
  private getStreamFromBuffer(file: Express.Multer.File) {
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);
    return bufferStream;
  }
}