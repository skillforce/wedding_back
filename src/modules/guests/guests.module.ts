import { Module } from '@nestjs/common';
import { CreateGuestUseCase } from './app/usecases/create-guest.usecase';
import { GuestsRepository } from './infra/guests.repository';
import { GuestsQueryRepository } from './infra/query/guests.query-repository';
import { GuestsController } from './api/guests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guest } from './domain/enteties/guest.entity';
import { DeleteGuestUseCase } from './app/usecases/delete-guest.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guest]),
    CreateGuestUseCase,
    DeleteGuestUseCase,
    GuestsRepository,
    GuestsQueryRepository,
    GuestsController,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class GuestsModule {}
