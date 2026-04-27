import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checklist } from '../../domain/entities/checklist.entity';
import { ChecklistPhase } from '../../domain/entities/checklist-phase.entity';
import { ChecklistItem } from '../../domain/entities/checklist-item.entity';
import { ChecklistViewDto } from '../../api/view-dto/checklist.view-dto';
import { ChecklistPhaseViewDto } from '../../api/view-dto/checklist-phase.view-dto';
import { ChecklistItemViewDto } from '../../api/view-dto/checklist-item.view-dto';
import { ChecklistItemCompletionViewDto } from '../../api/view-dto/checklist-item-completion.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CacheService } from '../../../../adapters/redis/cache.service';

@Injectable()
export class ChecklistQueryRepository {
  constructor(
    @InjectRepository(Checklist)
    private readonly checklistOrmRepository: Repository<Checklist>,
    @InjectRepository(ChecklistPhase)
    private readonly phaseOrmRepository: Repository<ChecklistPhase>,
    @InjectRepository(ChecklistItem)
    private readonly itemOrmRepository: Repository<ChecklistItem>,
    private readonly cache: CacheService,
  ) {}

  async findFullChecklistByUserId(userId: number): Promise<ChecklistViewDto | null> {
    return this.cache.wrapChecklist(userId, async () => {
        const checklist = await this.checklistOrmRepository.findOne({
          where: { userId },
          relations: {
            phases: {
              items: true,
            },
          },
          order: {
            phases: {
              sortOrder: 'ASC',
              items: {
                sortOrder: 'ASC',
              },
            },
          },
        });

        return checklist ? ChecklistViewDto.mapToViewDto(checklist) : null;
      });
  }

  async findFullChecklistByUserIdOrFail(userId: number): Promise<ChecklistViewDto> {
    const checklist = await this.findFullChecklistByUserId(userId);
    if (!checklist) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Checklist not found',
      });
    }
    return checklist;
  }

  async findPhaseViewByIdOrFail(id: string): Promise<ChecklistPhaseViewDto> {
    const phase = await this.phaseOrmRepository.findOne({
      where: { id },
      relations: {
        items: true,
      },
      order: {
        items: {
          sortOrder: 'ASC',
        },
      },
    });

    if (!phase) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Checklist phase not found',
      });
    }

    return ChecklistPhaseViewDto.mapToViewDto(phase);
  }

  async findItemViewByIdOrFail(id: string): Promise<ChecklistItemViewDto> {
    const item = await this.itemOrmRepository.findOneBy({ id });
    if (!item) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Checklist item not found',
      });
    }
    return ChecklistItemViewDto.mapToViewDto(item);
  }

  async findItemCompletionViewByIdOrFail(
    id: string,
  ): Promise<ChecklistItemCompletionViewDto> {
    const item = await this.itemOrmRepository.findOneBy({ id });
    if (!item) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Checklist item not found',
      });
    }
    return ChecklistItemCompletionViewDto.mapToViewDto(item);
  }
}
