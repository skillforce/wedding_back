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
  ApiBasicAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { IdNumberParamDto } from '../../../core/decorators/validation/queryParamDto';
import { CreateUserInputDto } from './input-dto/create-user-input-dto';
import { CreateUserCommand } from '../application/usecases/create-user.usecase';
import { UsersQueryRepository } from '../infra/query/users.query-repository';
import { DeleteUserCommand } from '../application/usecases/delete-user.usecase';
import { UsersViewDto } from './view-dto/users.view-dto';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';

@ApiTags('Users')
@ApiBasicAuth()
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private userQueryRepository: UsersQueryRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UsersViewDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createUser(@Body() dto: CreateUserInputDto): Promise<UsersViewDto> {
    const createdUserId = await this.commandBus.execute<
      CreateUserCommand,
      number
    >(new CreateUserCommand(dto));

    return await this.userQueryRepository.findUserByIdOrNotFoundFail(
      createdUserId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Delete a user by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUserById(@Param() { id }: IdNumberParamDto) {
    return this.commandBus.execute<DeleteUserCommand, void>(
      new DeleteUserCommand(id),
    );
  }
}