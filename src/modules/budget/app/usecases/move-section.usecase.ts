import { CacheService } from '../../../../adapters/redis/cache.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { MoveBudgetSectionInputDto } from '../../api/input-dto/move-budget-section.input-dto';
import { BudgetSectionsRepository } from '../../infra/budget-sections.repository';
import { BudgetSection } from '../../domain/entities/budget-section.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class MoveSectionCommand {
  constructor(
    public readonly dto: MoveBudgetSectionInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(MoveSectionCommand)
export class MoveSectionUseCase
  implements ICommandHandler<MoveSectionCommand, number[]>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly sectionsRepository: BudgetSectionsRepository,
    private readonly cache: CacheService,
  ) {}

  async execute({ dto, userId }: MoveSectionCommand): Promise<number[]> {
    const affectedIds = await this.dataSource.transaction(async (manager) => {
      const section = await this.sectionsRepository.findByIdForUpdateOrFail(
        manager,
        dto.sectionId,
      );
      this.checkOwnership(section.budget?.userId, userId, 'Budget section');

      const sections = await this.sectionsRepository.findByBudgetIdForUpdate(
        manager,
        section.budgetId,
      );
      const movingSection = this.findMovingSectionOrFail(sections, dto.sectionId);
      const sourceIndex = sections.findIndex(
        (existingSection) => existingSection.id === dto.sectionId,
      );
      const sectionsWithoutMoving = sections.filter(
        (existingSection) => existingSection.id !== dto.sectionId,
      );

      this.validateTargetIndex(dto.targetIndex, sectionsWithoutMoving.length);

      const reorderedSections = this.reindexSections(
        this.insertSectionAtIndex(
          sectionsWithoutMoving,
          dto.targetIndex,
          movingSection,
        ),
      );

      if (reorderedSections.length) {
        await this.sectionsRepository.saveManyWithManager(
          manager,
          reorderedSections,
        );
      }

      const affectedRangeStart = Math.min(sourceIndex, dto.targetIndex);
      const affectedRangeEnd = Math.max(sourceIndex, dto.targetIndex);

      return reorderedSections
        .slice(affectedRangeStart, affectedRangeEnd + 1)
        .map((reorderedSection) => reorderedSection.id);
    });
    await this.cache.evictBudget(userId);
    return affectedIds;
  }

  private validateTargetIndex(
    targetIndex: number,
    sectionsLength: number,
  ): void {
    if (targetIndex < 0 || targetIndex > sectionsLength) {
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'targetIndex is out of bounds',
        extensions: [
          {
            field: 'targetIndex',
            message: 'targetIndex is out of bounds',
          },
        ],
      });
    }
  }

  private reindexSections(sections: BudgetSection[]): BudgetSection[] {
    return sections.map((section, index) =>
      this.cloneSection(section, { sortOrder: index }),
    );
  }

  private findMovingSectionOrFail(
    sections: BudgetSection[],
    sectionId: number,
  ): BudgetSection {
    const movingSection = sections.find(
      (existingSection) => existingSection.id === sectionId,
    );
    if (!movingSection) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget section not found',
      });
    }

    return movingSection;
  }

  private insertSectionAtIndex(
    sections: BudgetSection[],
    targetIndex: number,
    section: BudgetSection,
  ): BudgetSection[] {
    return [
      ...sections.slice(0, targetIndex),
      section,
      ...sections.slice(targetIndex),
    ];
  }

  private cloneSection(
    section: BudgetSection,
    overrides: Partial<BudgetSection> = {},
  ): BudgetSection {
    return Object.assign(new BudgetSection(), section, overrides);
  }

  private checkOwnership(
    ownerUserId: number | undefined,
    userId: number,
    entityName: string,
  ): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `${entityName} does not belong to user`,
      });
    }
  }
}
