import { Module } from '@nestjs/common';
import { EmailConfig } from './email.config';
import { ResendAdapter } from './resend.adapter';

@Module({
  providers: [EmailConfig, ResendAdapter],
  exports: [ResendAdapter],
})
export class EmailModule {}