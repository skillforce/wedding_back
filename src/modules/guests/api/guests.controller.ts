import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

import { CommandBus } from '@nestjs/cqrs';
import { GuestsQueryRepository } from '../infra/query/guests.query-repository';
import { GuestsViewDto } from './view-dto/guests.view-dto';
import { CreateGuestInputDto } from './input-dto/guest.input-dto';
import { CreateGuestCommand } from '../app/usecases/create-guest.usecase';
import { DeleteGuestCommand } from '../app/usecases/delete-guest.usecase';
import { IdNumberParamDto } from '../../../core/decorators/validation/queryParamDto';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { limit: 5, ttl: 5000 } })
@Controller('guests')
export class GuestsController {
  constructor(
    private readonly guestsQueryRepository: GuestsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('')
  async getAllGuests(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GuestsViewDto[]> {
    return await this.guestsQueryRepository.findAllGuestsByUserId(user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  async createGuest(@Body() dto: CreateGuestInputDto) {
    const newGuestId = await this.commandBus.execute<
      CreateGuestCommand,
      number
    >(new CreateGuestCommand(dto));

    return this.guestsQueryRepository.findGuestsById(newGuestId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGuestById(
    @Param() { id }: IdNumberParamDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    return this.commandBus.execute<DeleteGuestCommand, void>(
      new DeleteGuestCommand(id, user.id),
    );
  }
}
