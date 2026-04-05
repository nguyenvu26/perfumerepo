import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload image to Cloudinary
   * @param file Buffer or Readable stream
   * @param folder Folder path in Cloudinary (optional)
   * @returns Promise with upload result containing url and public_id
   */
  async uploadImage(
    file: Buffer | Readable,
    folder: string = 'perfume-gpt/products',
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (!result) {
            reject(new Error('Upload failed: No result returned'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        },
      );

      if (Buffer.isBuffer(file)) {
        uploadStream.end(file);
      } else {
        file.pipe(uploadStream);
      }
    });
  }

  /**
   * Upload multiple images
   * @param files Array of Buffers or Readable streams
   * @param folder Folder path in Cloudinary
   * @returns Promise with array of upload results
   */
  async uploadImages(
    files: (Buffer | Readable)[],
    folder: string = 'perfume-gpt/products',
  ): Promise<Array<{ url: string; publicId: string }>> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete image from Cloudinary
   * @param publicId Cloudinary public_id
   * @returns Promise with deletion result
   */
  async deleteImage(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }

  /**
   * Delete multiple images
   * @param publicIds Array of Cloudinary public_ids
   * @returns Promise with deletion results
   */
  async deleteImages(publicIds: string[]): Promise<any> {
    return cloudinary.api.delete_resources(publicIds);
  }
}
