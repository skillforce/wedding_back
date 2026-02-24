import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

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
  constructor(private readonly tablesRepository: SeatingTablesRepository) {}

  async execute({ tableId, userId }: DeleteSeatingTableCommand): Promise<void> {
    await this.findTableAndCheckOwnership(tableId, userId);
    await this.tablesRepository.deleteByIdOrFail(tableId);
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