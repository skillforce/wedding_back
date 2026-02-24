import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
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
  constructor(private readonly tablesRepository: SeatingTablesRepository) {}

  async execute({ tableId, userId }: DeleteSeatingTableCommand): Promise<void> {
    await this.tablesRepository.findByIdAndUserIdOrFail(tableId, userId);
    await this.tablesRepository.deleteByIdOrFail(tableId);
  }
}