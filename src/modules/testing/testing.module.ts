import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingController } from './testing.controller';
import { EmailConfirmation } from '../user-accounts/domain/entities/email-confirmation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailConfirmation])],
  controllers: [TestingController],
})
export class TestingModule {}