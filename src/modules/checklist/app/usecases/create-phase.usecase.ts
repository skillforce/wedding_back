import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { CreatePhaseInputDto } from '../../api/input-dto/create-phase.input-dto';
import { ChecklistRepository } from '../../infra/checklist.repository';
import { ChecklistPhasesRepository } from '../../infra/checklist-phases.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CacheService } from '../../../../adapters/redis/cache.service';

const CHECKLIST_PHASES_LIMIT = 10;

export class CreatePhaseCommand {
  constructor(
    public readonly dto: CreatePhaseInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(CreatePhaseCommand)
export class CreatePhaseUseCase
  implements ICommandHandler<CreatePhaseCommand, string>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistRepository: ChecklistRepository,
    private readonly checklistPhasesRepository: ChecklistPhasesRepository,
    private readonly cache: CacheService,
  ) {}

  async execute({ dto, userId }: CreatePhaseCommand): Promise<string> {
    const phaseId = await this.dataSource.transaction(async (manager) => {
      const checklist = await this.checklistRepository.findByUserIdForUpdateOrFail(
        manager,
        userId,
      );

      const phasesCount = await this.checklistPhasesRepository.countByChecklistId(
        checklist.id,
        manager,
      );
      if (phasesCount >= CHECKLIST_PHASES_LIMIT) {
        throw new DomainException({
          code: DomainExceptionCode.ValidationError,
          message: 'Maximum of 10 phases per checklist reached',
          extensions: [
            {
              field: 'name',
              message: 'Maximum of 10 phases per checklist reached',
            },
          ],
        });
      }

      const maxSortOrder =
        await this.checklistPhasesRepository.findMaxSortOrderByChecklistId(
          checklist.id,
          manager,
        );
      const phase = await this.checklistPhasesRepository.saveWithManager(
        manager,
        {
          checklistId: checklist.id,
          name: dto.name,
          timeline: dto.timeline ?? null,
          icon: dto.icon ?? null,
          sortOrder: (maxSortOrder ?? -1) + 1,
        },
      );

      return phase.id;
    });
    await this.cache.evictChecklist(userId);
    return phaseId;
  }
}