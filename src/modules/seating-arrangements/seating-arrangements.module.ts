import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatingTable } from './domain/entities/seating-table.entity';
import { SeatingSeat } from './domain/entities/seating-seat.entity';
import { SeatingTablesRepository } from './infra/seating-tables.repository';
import { SeatingSeatsRepository } from './infra/seating-seats.repository';
import { SeatingTablesQueryRepository } from './infra/query/seating-tables.query-repository';
import { SeatingSeatsQueryRepository } from './infra/query/seating-seats.query-repository';
import { SeatingTablesController } from './api/seating-tables.controller';
import { SeatingSeatsController } from './api/seating-seats.controller';
import { CreateSeatingTableUseCase } from './app/usecases/create-seating-table.usecase';
import { UpdateSeatingTableUseCase } from './app/usecases/update-seating-table.usecase';
import { DeleteSeatingTableUseCase } from './app/usecases/delete-seating-table.usecase';
import { CreateSeatingSeatUseCase } from './app/usecases/create-seating-seat.usecase';
import { DeleteSeatingSeatUseCase } from './app/usecases/delete-seating-seat.usecase';
import { CreateDefaultSeatingTableUseCase } from './app/usecases/create-default-seating-table.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([SeatingTable, SeatingSeat])],
  controllers: [SeatingTablesController, SeatingSeatsController],
  providers: [
    SeatingTablesRepository,
    SeatingSeatsRepository,
    SeatingTablesQueryRepository,
    SeatingSeatsQueryRepository,
    CreateSeatingTableUseCase,
    UpdateSeatingTableUseCase,
    DeleteSeatingTableUseCase,
    CreateSeatingSeatUseCase,
    DeleteSeatingSeatUseCase,
    CreateDefaultSeatingTableUseCase,
  ],
  exports: [],
})
export class SeatingArrangementsModule {}