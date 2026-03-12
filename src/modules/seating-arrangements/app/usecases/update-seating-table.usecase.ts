import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateSeatingTableInputDto } from '../../api/input-dto/update-seating-table.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DataSource } from 'typeorm';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';

export class UpdateSeatingTableCommand {
  constructor(
    public readonly tableId: string,
    public readonly dto: UpdateSeatingTableInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(UpdateSeatingTableCommand)
export class UpdateSeatingTableUseCase
  implements ICommandHandler<UpdateSeatingTableCommand, void>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly tablesRepository: SeatingTablesRepository,
  ) {}

  async execute({ tableId, dto, userId }: UpdateSeatingTableCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const table = await this.tablesRepository.findByIdForUpdateOrFail(manager, tableId);
      this.checkTableOwnership(table.arrangement!.user_id, userId);
      Object.assign(table, dto);
      await this.tablesRepository.saveEntityWithManager(manager, table);
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
