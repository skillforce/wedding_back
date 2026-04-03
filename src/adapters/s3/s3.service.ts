import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3Config } from './s3.config';

@Injectable()
export class S3Service {
  private readonly client: S3Client;

  constructor(private readonly s3Config: S3Config) {
    this.client = new S3Client({
      endpoint: this.s3Config.endpoint,
      region: this.s3Config.region,
      credentials: {
        accessKeyId: this.s3Config.accessKeyId,
        secretAccessKey: this.s3Config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(
    folder: string,
    key: string,
    file: Buffer,
    contentType: string,
  ): Promise<string> {
    const fullKey = `${folder}/${key}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.s3Config.bucket,
        Key: fullKey,
        Body: file,
        ContentType: contentType,
      }),
    );

    return `${this.s3Config.endpoint}/${this.s3Config.bucket}/${fullKey}`;
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.s3Config.bucket,
        Key: key,
      }),
    );
  }
}