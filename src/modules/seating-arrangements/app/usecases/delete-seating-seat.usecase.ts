import { CacheService } from '../../../../adapters/redis/cache.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DataSource } from 'typeorm';
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
    private readonly dataSource: DataSource,
    private readonly tablesRepository: SeatingTablesRepository,
    private readonly seatsRepository: SeatingSeatsRepository,
    private readonly cache: CacheService,
  ) {}

  async execute({ seatId, tableId, userId }: DeleteSeatingSeatCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const table = await this.tablesRepository.findByIdForUpdateOrFail(manager, tableId);
      this.checkTableOwnership(table.arrangement!.user_id, userId);

      await this.seatsRepository.findByIdAndTableIdForUpdateOrFail(
        manager,
        seatId,
        tableId,
      );
      await this.seatsRepository.deleteByIdWithManager(manager, seatId);
    });
    await this.cache.evictSeatingArrangement(userId);
  }

  private checkTableOwnership(ownerUserId: number, userId: number): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Seating table does not belong to user',
      });
    }
  }
}