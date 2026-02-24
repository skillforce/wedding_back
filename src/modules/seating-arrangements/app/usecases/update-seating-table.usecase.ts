import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';
import { UpdateSeatingTableInputDto } from '../../api/input-dto/update-seating-table.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

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
  constructor(private readonly tablesRepository: SeatingTablesRepository) {}

  async execute({ tableId, dto, userId }: UpdateSeatingTableCommand): Promise<void> {
    await this.findTableAndCheckOwnership(tableId, userId);
    await this.tablesRepository.update(tableId, dto);
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