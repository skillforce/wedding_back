import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Budget } from '../../domain/entities/budget.entity';
import { BudgetSection } from '../../domain/entities/budget-section.entity';
import { BudgetViewDto } from '../../api/view-dto/budget.view-dto';
import { BudgetSectionViewDto } from '../../api/view-dto/budget-section.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CacheService } from '../../../../adapters/redis/cache.service';

@Injectable()
export class BudgetQueryRepository {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetOrmRepository: Repository<Budget>,
    @InjectRepository(BudgetSection)
    private readonly sectionOrmRepository: Repository<BudgetSection>,
    private readonly cache: CacheService,
  ) {}

  async findFullBudgetByUserId(userId: number): Promise<BudgetViewDto> {
    return this.cache.wrapBudget(userId, async () => {
        const budget = await this.budgetOrmRepository.findOne({
          where: { userId },
          relations: {
            sections: {
              items: true,
            },
          },
          order: {
            sections: {
              sortOrder: 'ASC',
              items: {
                sortOrder: 'ASC',
              },
            },
          },
        });
        if (!budget) {
          throw new DomainException({
            code: DomainExceptionCode.NotFound,
            message: 'Budget not found',
          });
        }
        return BudgetViewDto.mapToViewDto(budget);
      });
  }

  async findSectionViewsByIdsForUser(
    userId: number,
    sectionIds: number[],
  ): Promise<BudgetSectionViewDto[]> {
    const uniqueSectionIds = [...new Set(sectionIds)];
    if (!uniqueSectionIds.length) {
      return [];
    }

    const sections = await this.sectionOrmRepository.find({
      where: {
        id: In(uniqueSectionIds),
        budget: {
          userId,
        },
      },
      relations: {
        items: true,
      },
      order: {
        sortOrder: 'ASC',
        items: {
          sortOrder: 'ASC',
        },
      },
    });

    return sections.map(BudgetSectionViewDto.mapToViewDto);
  }
}