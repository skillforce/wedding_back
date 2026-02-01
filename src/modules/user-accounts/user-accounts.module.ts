import { Module } from '@nestjs/common';
import { BcryptService } from './application/bcrypt.service';

@Module({
  imports: [],
  controllers: [],
  providers: [BcryptService],
  exports: [BcryptService],
})
export class UserAccountsModule {}
