import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DataSource } from 'typeorm';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';

export class DeleteSeatingTableCommand {
  constructor(
    public readonly tableId: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(DeleteSeatingTableCommand)
export class DeleteSeatingTableUseCase
  implements ICommandHandler<DeleteSeatingTableCommand, void>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly tablesRepository: SeatingTablesRepository,
  ) {}

  async execute({ tableId, userId }: DeleteSeatingTableCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const table = await this.tablesRepository.findByIdForUpdateOrFail(manager, tableId);
      this.checkTableOwnership(table.arrangement!.user_id, userId);
      await this.tablesRepository.deleteByIdWithManager(manager, tableId);
    });
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
