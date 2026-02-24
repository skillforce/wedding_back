import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';
import { UpdateSeatingTableInputDto } from '../../api/input-dto/update-seating-table.input-dto';

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
    await this.tablesRepository.findByIdAndUserIdOrFail(tableId, userId);
    await this.tablesRepository.update(tableId, dto);
  }
}