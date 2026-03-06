import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { CreatePhaseInputDto } from './input-dto/create-phase.input-dto';
import { UpdatePhaseInputDto } from './input-dto/update-phase.input-dto';
import { ChecklistQueryRepository } from '../infra/query/checklist.query-repository';
import { ChecklistPhaseViewDto } from './view-dto/checklist-phase.view-dto';
import { CreatePhaseCommand } from '../app/usecases/create-phase.usecase';
import { UpdatePhaseCommand } from '../app/usecases/update-phase.usecase';
import { DeletePhaseCommand } from '../app/usecases/delete-phase.usecase';

@ApiTags('Checklist phases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checklist/phases')
export class ChecklistPhasesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly checklistQueryRepository: ChecklistQueryRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPhase(
    @Body() dto: CreatePhaseInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<ChecklistPhaseViewDto> {
    const phaseId = await this.commandBus.execute<CreatePhaseCommand, string>(
      new CreatePhaseCommand(dto, user.id),
    );
    return this.checklistQueryRepository.findPhaseViewByIdOrFail(phaseId);
  }

  @Patch(':phaseId')
  async updatePhase(
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
    @Body() dto: UpdatePhaseInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<ChecklistPhaseViewDto> {
    await this.commandBus.execute<UpdatePhaseCommand, void>(
      new UpdatePhaseCommand(phaseId, dto, user.id),
    );
    return this.checklistQueryRepository.findPhaseViewByIdOrFail(phaseId);
  }

  @Delete(':phaseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePhase(
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute<DeletePhaseCommand, void>(
      new DeletePhaseCommand(phaseId, user.id),
    );
  }
}
