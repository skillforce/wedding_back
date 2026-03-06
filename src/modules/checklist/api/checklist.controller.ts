import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { ChecklistQueryRepository } from '../infra/query/checklist.query-repository';
import { ChecklistViewDto } from './view-dto/checklist.view-dto';
import { CreateDefaultChecklistCommand } from '../app/usecases/create-default-checklist.usecase';
import { ResetChecklistCommand } from '../app/usecases/reset-checklist.usecase';

@ApiTags('Checklist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checklist')
export class ChecklistController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly checklistQueryRepository: ChecklistQueryRepository,
  ) {}

  @Get()
  async getChecklist(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<ChecklistViewDto> {
    await this.commandBus.execute(
      new CreateDefaultChecklistCommand(user.id),
    );
    return this.checklistQueryRepository.findFullChecklistByUserIdOrFail(user.id);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetChecklist(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<ChecklistViewDto> {
    await this.commandBus.execute(new ResetChecklistCommand(user.id));
    return this.checklistQueryRepository.findFullChecklistByUserIdOrFail(user.id);
  }
}
