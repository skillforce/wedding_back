import { Injectable } from '@nestjs/common';
import { S3Service } from '../../s3/s3.service';

@Injectable()
export class ProfileImageService {
  private readonly folder = 'profiles/avatars';

  constructor(private readonly s3Service: S3Service) {}

  async upload(
    userId: number,
    file: Buffer,
    contentType: string,
  ): Promise<string> {
    return this.s3Service.uploadFile(
      this.folder,
      String(userId),
      file,
      contentType,
    );
  }

}