import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

import { CommandBus } from '@nestjs/cqrs';
import { GuestsQueryRepository } from '../infra/query/guests.query-repository';
import { GuestsViewDto } from './view-dto/guests.view-dto';
import { CreateGuestInputDto } from './input-dto/guest.input-dto';
import { CreateGuestCommand } from '../app/usecases/create-guest.usecase';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { DeleteGuestCommand } from '../app/usecases/delete-guest.usecase';
import { IdNumberParamDto } from '../../../core/decorators/validation/queryParamDto';

@Controller('/guests')
export class GuestsController {
  constructor(
    private readonly guestsQueryRepository: GuestsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('/')
  async getAllGuests(): Promise<GuestsViewDto[]> {
    const guests = await this.guestsQueryRepository.findAllGuests();
    return guests.map((guest) => GuestsViewDto.mapToViewDto(guest));
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() dto: CreateGuestInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    return await this.commandBus.execute<CreateGuestCommand, number>(
      new CreateGuestCommand(dto, user.id),
    );
  }

  @ApiParam({ name: 'id' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserById(@Param() { id }: IdNumberParamDto) {
    return this.commandBus.execute<DeleteGuestCommand, void>(
      new DeleteGuestCommand(id),
    );
  }
}
