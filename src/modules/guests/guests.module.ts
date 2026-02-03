import { Module } from '@nestjs/common';
import { CreateGuestUseCase } from './app/usecases/create-guest.usecase';
import { GuestsRepository } from './infra/guests.repository';
import { GuestsQueryRepository } from './infra/query/guests.query-repository';
import { GuestsController } from './api/guests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guest } from './domain/enteties/guest.entity';
import { DeleteGuestUseCase } from './app/usecases/delete-guest.usecase';
import { User } from '../user-accounts/domain/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Guest, User])],
  controllers: [],
  providers: [
    GuestsRepository,
    GuestsQueryRepository,
    CreateGuestUseCase,
    DeleteGuestUseCase,
    GuestsController,
  ],
  exports: [],
})
export class GuestsModule {}
