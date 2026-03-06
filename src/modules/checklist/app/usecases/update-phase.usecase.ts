import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { UpdatePhaseInputDto } from '../../api/input-dto/update-phase.input-dto';
import { ChecklistPhasesRepository } from '../../infra/checklist-phases.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class UpdatePhaseCommand {
  constructor(
    public readonly phaseId: string,
    public readonly dto: UpdatePhaseInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(UpdatePhaseCommand)
export class UpdatePhaseUseCase
  implements ICommandHandler<UpdatePhaseCommand, void>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistPhasesRepository: ChecklistPhasesRepository,
  ) {}

  async execute({ phaseId, dto, userId }: UpdatePhaseCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const phase = await this.checklistPhasesRepository.findByIdForUpdateOrFail(
        manager,
        phaseId,
      );
      this.checkOwnership(phase.checklist?.userId, userId);

      if ('name' in dto) {
        phase.name = dto.name ?? null;
      }
      if ('timeline' in dto) {
        phase.timeline = dto.timeline ?? null;
      }
      if ('icon' in dto) {
        phase.icon = dto.icon ?? null;
      }

      await this.checklistPhasesRepository.saveEntityWithManager(manager, phase);
    });
  }

  private checkOwnership(ownerUserId: number | undefined, userId: number): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Checklist phase does not belong to user',
      });
    }
  }
}
