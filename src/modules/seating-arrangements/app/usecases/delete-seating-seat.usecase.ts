import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';
import { SeatingSeatsRepository } from '../../infra/seating-seats.repository';

export class DeleteSeatingSeatCommand {
  constructor(
    public readonly seatId: string,
    public readonly tableId: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(DeleteSeatingSeatCommand)
export class DeleteSeatingSeatUseCase
  implements ICommandHandler<DeleteSeatingSeatCommand, void>
{
  constructor(
    private readonly tablesRepository: SeatingTablesRepository,
    private readonly seatsRepository: SeatingSeatsRepository,
  ) {}

  async execute({ seatId, tableId, userId }: DeleteSeatingSeatCommand): Promise<void> {
    await this.tablesRepository.findByIdAndUserIdOrFail(tableId, userId);
    await this.seatsRepository.deleteByIdOrFail(seatId);
  }
}