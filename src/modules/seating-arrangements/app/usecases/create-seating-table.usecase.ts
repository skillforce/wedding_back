import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';
import { CreateSeatingTableInputDto } from '../../api/input-dto/create-seating-table.input-dto';

export class CreateSeatingTableCommand {
  constructor(
    public readonly dto: CreateSeatingTableInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(CreateSeatingTableCommand)
export class CreateSeatingTableUseCase implements ICommandHandler<
  CreateSeatingTableCommand,
  string
> {
  constructor(private readonly tablesRepository: SeatingTablesRepository) {}

  async execute({ dto, userId }: CreateSeatingTableCommand): Promise<string> {
    const newTable = {
      user_id: userId,
      name: dto.name,
      position: dto.position,
      shape: dto.shape ?? 'circle',
      rotation: dto.rotation ?? 0,
    };
    return this.tablesRepository.save(newTable);
  }
}
