import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';
import { SeatingSeatsRepository } from '../../infra/seating-seats.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

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
    await this.findTableAndCheckOwnership(tableId, userId);
    await this.seatsRepository.deleteByIdOrFail(seatId);
  }

  private async findTableAndCheckOwnership(tableId: string, userId: number): Promise<void> {
    const table = await this.tablesRepository.findByIdOrFail(tableId);
    if (table.user_id !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Seating table does not belong to user',
      });
    }
  }
}