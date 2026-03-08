import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';

export class CreateDefaultSeatingTableCommand {
  constructor(public readonly userId: number) {}
}

@CommandHandler(CreateDefaultSeatingTableCommand)
export class CreateDefaultSeatingTableUseCase implements ICommandHandler<
  CreateDefaultSeatingTableCommand,
  void
> {
  constructor(private readonly tablesRepository: SeatingTablesRepository) {}

  async execute({ userId }: CreateDefaultSeatingTableCommand): Promise<void> {
    await this.tablesRepository.save({
      user_id: userId,
      name: 'Молодожены',
      position: { x: 10, y: 0 },
      shape: 'rect',
      rotation: 0,
      radius: 70,
    });
  }
}
