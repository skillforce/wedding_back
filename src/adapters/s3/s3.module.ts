import { Module } from '@nestjs/common';
import { S3Config } from './s3.config';
import { S3Service } from './s3.service';

@Module({
  providers: [S3Config, S3Service],
  exports: [S3Service],
})
export class S3Module {}
