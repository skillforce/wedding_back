import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { CreateGuestResponseInputDto } from './input-dto/guest-response.input-dto';
import { CreateGuestResponseCommand } from '../app/usecases/create-guest-response.usecase';
import { DeleteGuestResponseCommand } from '../app/usecases/delete-guest-response.usecase';
import { IdUuidParamDto } from '../../../core/decorators/validation/queryParamDto';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';

@ApiTags('Guest Responses')
@Controller('guests')
export class GuestResponsesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/response')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a response for a guest' })
  @ApiParam({ name: 'id', description: 'Guest UUID' })
  @ApiResponse({ status: 201, description: 'Response submitted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or response already submitted',
  })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  async createGuestResponse(
    @Param() { id }: IdUuidParamDto,
    @Body() dto: CreateGuestResponseInputDto,
  ): Promise<void> {
    await this.commandBus.execute<CreateGuestResponseCommand, string>(
      new CreateGuestResponseCommand(id, dto),
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/response')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete the response for a guest' })
  @ApiParam({ name: 'id', description: 'Guest UUID' })
  @ApiResponse({ status: 204, description: 'Response deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - guest does not belong to user',
  })
  @ApiResponse({ status: 404, description: 'Guest or response not found' })
  async deleteGuestResponse(
    @Param() { id }: IdUuidParamDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute<DeleteGuestResponseCommand, void>(
      new DeleteGuestResponseCommand(id, user.id),
    );
  }
}
