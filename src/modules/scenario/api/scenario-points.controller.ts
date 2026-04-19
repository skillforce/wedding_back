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
import { ScenarioQueryRepository } from '../infra/query/scenario.query-repository';
import { ScenarioViewDto } from './view-dto/scenario.view-dto';
import { ScenarioPointViewDto } from './view-dto/scenario-point.view-dto';
import { CreateScenarioPointInputDto } from './input-dto/create-scenario-point.input-dto';
import { UpdateScenarioPointInputDto } from './input-dto/update-scenario-point.input-dto';
import { CreateScenarioPointCommand } from '../app/usecases/create-scenario-point.usecase';
import { UpdateScenarioPointCommand } from '../app/usecases/update-scenario-point.usecase';
import { DeleteScenarioPointCommand } from '../app/usecases/delete-scenario-point.usecase';

@ApiTags('Scenario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserOwnershipGuard)
@ApiQuery({ name: 'userId', required: false, type: Number })
@Controller('scenario/points')
export class ScenarioPointsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly scenarioQueryRepository: ScenarioQueryRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPoint(
    @Body() dto: CreateScenarioPointInputDto,
    @EffectiveUserId() userId: number,
  ): Promise<ScenarioViewDto> {
    await this.commandBus.execute<CreateScenarioPointCommand, string>(
      new CreateScenarioPointCommand(dto, userId),
    );
    return this.scenarioQueryRepository.findScenarioByUserIdOrFail(userId);
  }

  @Patch(':pointId')
  async updatePoint(
    @Param('pointId', new ParseUUIDPipe()) pointId: string,
    @Body() dto: UpdateScenarioPointInputDto,
    @EffectiveUserId() userId: number,
  ): Promise<ScenarioPointViewDto> {
    await this.commandBus.execute<UpdateScenarioPointCommand, void>(
      new UpdateScenarioPointCommand(pointId, dto, userId),
    );
    return this.scenarioQueryRepository.findPointByIdOrFail(pointId);
  }

  @Delete(':pointId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePoint(
    @Param('pointId', new ParseUUIDPipe()) pointId: string,
    @EffectiveUserId() userId: number,
  ): Promise<void> {
    await this.commandBus.execute<DeleteScenarioPointCommand, void>(
      new DeleteScenarioPointCommand(pointId, userId),
    );
  }
}
