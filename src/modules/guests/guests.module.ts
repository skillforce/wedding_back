import { Module } from '@nestjs/common';
import { CreateGuestUseCase } from './app/usecases/create-guest.usecase';
import { GuestsRepository } from './infra/guests.repository';
import { GuestResponseRepository } from './infra/guest-response.repository';
import { GuestsQueryRepository } from './infra/query/guests.query-repository';
import { GuestsController } from './api/guests.controller';
import { GuestResponsesController } from './api/guest-responses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guest } from './domain/enteties/guest.entity';
import { GuestResponse } from './domain/enteties/guest-response.entity';
import { DeleteGuestUseCase } from './app/usecases/delete-guest.usecase';
import { CreateGuestResponseUseCase } from './app/usecases/create-guest-response.usecase';
import { DeleteGuestResponseUseCase } from './app/usecases/delete-guest-response.usecase';
import { User } from '../user-accounts/domain/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Guest, GuestResponse, User])],
  controllers: [GuestsController, GuestResponsesController],
  providers: [
    GuestsRepository,
    GuestResponseRepository,
    GuestsQueryRepository,
    CreateGuestUseCase,
    DeleteGuestUseCase,
    CreateGuestResponseUseCase,
    DeleteGuestResponseUseCase,
  ],
  exports: [],
})
export class GuestsModule {}