import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageService {
  async compress(file: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
    const buffer = await sharp(file)
      .webp({ quality: 75, lossless: false, nearLossless: true })
      .toBuffer();

    return { buffer, contentType: 'image/webp' };
  }
}