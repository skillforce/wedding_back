import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { S3Service } from '../../../adapters/s3/s3.service';

@Injectable()
export class ProfileImageService {
  private readonly folder = 'profiles/avatars';

  constructor(private readonly s3Service: S3Service) {}

  async upload(file: Buffer, contentType: string): Promise<string> {
    return this.s3Service.uploadFile(
      this.folder,
      randomUUID(),
      file,
      contentType,
    );
  }

  async delete(imageUrl: string): Promise<void> {
    await this.s3Service.deleteFileByUrl(imageUrl);
  }
}
