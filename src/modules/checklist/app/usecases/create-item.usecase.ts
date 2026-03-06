import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { CreateItemInputDto } from '../../api/input-dto/create-item.input-dto';
import { ChecklistPhasesRepository } from '../../infra/checklist-phases.repository';
import { ChecklistItemsRepository } from '../../infra/checklist-items.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { ChecklistItemPriority } from '../../domain/entities/checklist-item.entity';

const CHECKLIST_ITEMS_LIMIT = 20;

export class CreateItemCommand {
  constructor(
    public readonly phaseId: string,
    public readonly dto: CreateItemInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(CreateItemCommand)
export class CreateItemUseCase implements ICommandHandler<
  CreateItemCommand,
  string
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistPhasesRepository: ChecklistPhasesRepository,
    private readonly checklistItemsRepository: ChecklistItemsRepository,
  ) {}

  async execute({ phaseId, dto, userId }: CreateItemCommand): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const phase =
        await this.checklistPhasesRepository.findByIdForUpdateOrFail(
          manager,
          phaseId,
        );
      this.checkOwnership(phase.checklist?.userId, userId);

      const itemsCount = await this.checklistItemsRepository.countByPhaseId(
        phaseId,
        manager,
      );
      if (itemsCount >= CHECKLIST_ITEMS_LIMIT) {
        throw new DomainException({
          code: DomainExceptionCode.ValidationError,
          message: 'Maximum of 20 items per phase reached',
          extensions: [
            {
              field: 'title',
              message: 'Maximum of 20 items per phase reached',
            },
          ],
        });
      }

      const maxSortOrder =
        await this.checklistItemsRepository.findMaxSortOrderByPhaseId(
          phaseId,
          manager,
        );

      const newItem = {
        phaseId,
        title: dto.title,
        note: dto.note ?? null,
        comment: null,
        completed: false,
        priority: dto.priority ?? ChecklistItemPriority.Normal,
        sortOrder: (maxSortOrder ?? -1) + 1,
      };
      const item = await this.checklistItemsRepository.saveWithManager(
        manager,
        newItem,
      );

      return item.id;
    });
  }

  private checkOwnership(
    ownerUserId: number | undefined,
    userId: number,
  ): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Checklist phase does not belong to user',
      });
    }
  }
}
