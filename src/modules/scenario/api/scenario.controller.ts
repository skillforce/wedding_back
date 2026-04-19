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
import { ScenarioQueryRepository } from '../infra/query/scenario.query-repository';
import { ScenarioViewDto } from './view-dto/scenario.view-dto';
import { CreateDefaultScenarioCommand } from '../app/usecases/create-default-scenario.usecase';
import { SeedScenarioCommand } from '../app/usecases/seed-scenario.usecase';
import { ScenarioLocale } from '../app/usecases/default-scenario-points';

@ApiTags('Scenario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserOwnershipGuard)
@ApiQuery({ name: 'userId', required: false, type: Number })
@Controller('scenario')
export class ScenarioController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly scenarioQueryRepository: ScenarioQueryRepository,
  ) {}

  @Get()
  async getScenario(
    @EffectiveUserId() userId: number,
  ): Promise<ScenarioViewDto> {
    await this.commandBus.execute(new CreateDefaultScenarioCommand(userId));
    return this.scenarioQueryRepository.findScenarioByUserIdOrFail(userId);
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedScenario(
    @EffectiveUserId() userId: number,
    @Query('locale') locale?: ScenarioLocale,
  ): Promise<ScenarioViewDto> {
    await this.commandBus.execute(new SeedScenarioCommand(userId, locale));
    return this.scenarioQueryRepository.findScenarioByUserIdOrFail(userId);
  }
}
