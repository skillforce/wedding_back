import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { UpdateChecklistPhaseItemInputDto } from '../../api/input-dto/update-checklist-phase-item-input.dto';
import { ChecklistItemsRepository } from '../../infra/checklist-items.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class UpdateItemCommand {
  constructor(
    public readonly phaseId: string,
    public readonly itemId: string,
    public readonly dto: UpdateChecklistPhaseItemInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(UpdateItemCommand)
export class UpdateItemUseCase implements ICommandHandler<
  UpdateItemCommand,
  void
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistItemsRepository: ChecklistItemsRepository,
  ) {}

  async execute({
    phaseId,
    itemId,
    dto,
    userId,
  }: UpdateItemCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const item =
        await this.checklistItemsRepository.findByIdAndPhaseIdForUpdateOrFail(
          manager,
          itemId,
          phaseId,
        );
      this.checkOwnership(item.phase?.checklist?.userId, userId);

      if ('title' in dto && dto.title !== undefined) {
        item.title = dto.title;
      }
      if ('note' in dto) {
        item.note = dto.note ?? null;
      }
      if ('comment' in dto) {
        item.comment = dto.comment ?? null;
      }
      if ('completed' in dto && dto.completed !== undefined) {
        item.completed = dto.completed;
      }
      if ('priority' in dto && dto.priority !== undefined) {
        item.priority = dto.priority;
      }

      await this.checklistItemsRepository.saveEntityWithManager(manager, item);
    });
  }

  private checkOwnership(
    ownerUserId: number | undefined,
    userId: number,
  ): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Checklist item does not belong to user',
      });
    }
  }
}
