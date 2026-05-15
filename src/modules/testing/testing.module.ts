import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingController } from './testing.controller';
import { Confirmation } from '../user-accounts/domain/entities/confirmation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Confirmation])],
  controllers: [TestingController],
})
export class TestingModule {}