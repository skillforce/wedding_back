import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatingTable } from './domain/entities/seating-table.entity';
import { SeatingSeat } from './domain/entities/seating-seat.entity';
import { SeatingArrangement } from './domain/entities/seating-arrangement.entity';
import { SeatingTablesRepository } from './infra/seating-tables.repository';
import { SeatingSeatsRepository } from './infra/seating-seats.repository';
import { SeatingArrangementsRepository } from './infra/seating-arrangements.repository';
import { SeatingTablesQueryRepository } from './infra/query/seating-tables.query-repository';
import { SeatingSeatsQueryRepository } from './infra/query/seating-seats.query-repository';
import { SeatingArrangementsQueryRepository } from './infra/query/seating-arrangements.query-repository';
import { SeatingArrangementsController } from './api/seating-arrangements.controller';
import { SeatingTablesController } from './api/seating-tables.controller';
import { SeatingSeatsController } from './api/seating-seats.controller';
import { CreateSeatingTableUseCase } from './app/usecases/create-seating-table.usecase';
import { UpdateSeatingTableUseCase } from './app/usecases/update-seating-table.usecase';
import { DeleteSeatingTableUseCase } from './app/usecases/delete-seating-table.usecase';
import { CreateSeatingSeatUseCase } from './app/usecases/create-seating-seat.usecase';
import { DeleteSeatingSeatUseCase } from './app/usecases/delete-seating-seat.usecase';
import { CreateDefaultSeatingArrangementUseCase } from './app/usecases/create-default-seating-arrangement.usecase';
import { UpdateSeatingArrangementUseCase } from './app/usecases/update-seating-arrangement.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([SeatingTable, SeatingSeat, SeatingArrangement])],
  controllers: [SeatingArrangementsController, SeatingTablesController, SeatingSeatsController],
  providers: [
    SeatingTablesRepository,
    SeatingSeatsRepository,
    SeatingArrangementsRepository,
    SeatingTablesQueryRepository,
    SeatingSeatsQueryRepository,
    SeatingArrangementsQueryRepository,
    CreateSeatingTableUseCase,
    UpdateSeatingTableUseCase,
    DeleteSeatingTableUseCase,
    CreateSeatingSeatUseCase,
    DeleteSeatingSeatUseCase,
    CreateDefaultSeatingArrangementUseCase,
    UpdateSeatingArrangementUseCase,
  ],
  exports: [],
})
export class SeatingArrangementsModule {}