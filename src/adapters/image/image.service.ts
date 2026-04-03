import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageService {
  async compress(
    file: Buffer,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const buffer = await sharp(file).avif({ quality: 70, effort: 4 }).toBuffer();

    return { buffer, contentType: 'image/avif' };
  }
}
