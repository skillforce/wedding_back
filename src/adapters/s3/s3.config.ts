import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../core/helpers/config-validation.utility';

@Injectable()
export class S3Config {
  @IsNotEmpty({ message: 'Set Env variable S3_ENDPOINT' })
  endpoint!: string;

  @IsNotEmpty({ message: 'Set Env variable S3_BUCKET' })
  bucket!: string;

  @IsNotEmpty({ message: 'Set Env variable S3_REGION' })
  region!: string;

  @IsNotEmpty({ message: 'Set Env variable S3_ACCESS_KEY_ID' })
  accessKeyId!: string;

  @IsNotEmpty({ message: 'Set Env variable S3_SECRET_ACCESS_KEY' })
  secretAccessKey!: string;

  constructor(private readonly configService: ConfigService<any, true>) {
    this.endpoint = this.configService.get<string>('S3_ENDPOINT');
    this.bucket = this.configService.get<string>('S3_BUCKET');
    this.region = this.configService.get<string>('S3_REGION');
    this.accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
    this.secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');

    configValidationUtility.validateConfig(this);
  }
}