import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { S3Service } from '../../../adapters/s3/s3.service';
import { S3Config } from '../../../adapters/s3/s3.config';

@Injectable()
export class ProfileImageService {
  private readonly folder = 'profiles/avatars';

  constructor(
    private readonly s3Service: S3Service,
    private readonly s3Config: S3Config,
  ) {}

  async upload(file: Buffer, contentType: string): Promise<string> {
    return this.s3Service.uploadFile(
      this.folder,
      randomUUID(),
      file,
      contentType,
    );
  }

  async delete(imageUrl: string): Promise<void> {
    const key = this.extractKey(imageUrl);
    if (!key) return;
    await this.s3Service.deleteFile(key);
  }

  private extractKey(imageUrl: string): string | null {
    const prefix = `${this.s3Config.endpoint}/${this.s3Config.bucket}/`;
    if (!imageUrl.startsWith(prefix)) return null;
    return imageUrl.slice(prefix.length);
  }
}
