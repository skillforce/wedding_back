import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { UserOwnershipGuard } from '../../user-accounts/guards/ownership/user-ownership.guard';
import { EffectiveUserId } from '../../user-accounts/guards/ownership/effective-user-id.decorator';
import { ChecklistQueryRepository } from '../infra/query/checklist.query-repository';
import { ChecklistViewDto } from './view-dto/checklist.view-dto';
import { CreateDefaultChecklistCommand } from '../app/usecases/create-default-checklist.usecase';
import { ResetChecklistCommand } from '../app/usecases/reset-checklist.usecase';
import { ChecklistLocale } from '../app/usecases/default-checklist-phases';

@ApiTags('Checklist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserOwnershipGuard)
@ApiQuery({ name: 'userId', required: false, type: Number })
@Controller('checklist')
export class ChecklistController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly checklistQueryRepository: ChecklistQueryRepository,
  ) {}

  @Get()
  async getChecklist(
    @EffectiveUserId() userId: number,
    @Query('locale') locale?: ChecklistLocale,
  ): Promise<ChecklistViewDto> {
    await this.commandBus.execute(
      new CreateDefaultChecklistCommand(userId, locale),
    );
    return this.checklistQueryRepository.findFullChecklistByUserIdOrFail(userId);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetChecklist(
    @EffectiveUserId() userId: number,
    @Query('locale') locale?: ChecklistLocale,
  ): Promise<ChecklistViewDto> {
    await this.commandBus.execute(new ResetChecklistCommand(userId, locale));
    return this.checklistQueryRepository.findFullChecklistByUserIdOrFail(userId);
  }
}