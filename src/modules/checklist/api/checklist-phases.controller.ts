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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { UserOwnershipGuard } from '../../user-accounts/guards/ownership/user-ownership.guard';
import { EffectiveUserId } from '../../user-accounts/guards/ownership/effective-user-id.decorator';
import { CreatePhaseInputDto } from './input-dto/create-phase.input-dto';
import { UpdatePhaseInputDto } from './input-dto/update-phase.input-dto';
import { ChecklistQueryRepository } from '../infra/query/checklist.query-repository';
import { ChecklistPhaseViewDto } from './view-dto/checklist-phase.view-dto';
import { CreatePhaseCommand } from '../app/usecases/create-phase.usecase';
import { UpdatePhaseCommand } from '../app/usecases/update-phase.usecase';
import { DeletePhaseCommand } from '../app/usecases/delete-phase.usecase';

@ApiTags('Checklist phases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserOwnershipGuard)
@ApiQuery({ name: 'userId', required: false, type: Number })
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
    @EffectiveUserId() userId: number,
  ): Promise<ChecklistPhaseViewDto> {
    const phaseId = await this.commandBus.execute<CreatePhaseCommand, string>(
      new CreatePhaseCommand(dto, userId),
    );
    return this.checklistQueryRepository.findPhaseViewByIdOrFail(phaseId);
  }

  @Patch(':phaseId')
  async updatePhase(
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
    @Body() dto: UpdatePhaseInputDto,
    @EffectiveUserId() userId: number,
  ): Promise<ChecklistPhaseViewDto> {
    await this.commandBus.execute<UpdatePhaseCommand, void>(
      new UpdatePhaseCommand(phaseId, dto, userId),
    );
    return this.checklistQueryRepository.findPhaseViewByIdOrFail(phaseId);
  }

  @Delete(':phaseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePhase(
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
    @EffectiveUserId() userId: number,
  ): Promise<void> {
    await this.commandBus.execute<DeletePhaseCommand, void>(
      new DeletePhaseCommand(phaseId, userId),
    );
  }
}