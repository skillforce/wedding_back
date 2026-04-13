import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../core/helpers/config-validation.utility';

@Injectable()
export class EmailConfig {
  @IsNotEmpty({ message: 'Set Env variable RESEND_API_KEY' })
  apiKey!: string;

  @IsEmail({}, { message: 'Set Env variable RESEND_FROM_EMAIL with a valid email' })
  fromEmail!: string;

  constructor(private readonly configService: ConfigService<any, true>) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL');
    configValidationUtility.validateConfig(this);
  }
}