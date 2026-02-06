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
import { CommandBus } from '@nestjs/cqrs';
import { ApiParam } from '@nestjs/swagger';
import { IdNumberParamDto } from '../../../core/decorators/validation/queryParamDto';
import { CreateUserInputDto } from './input-dto/create-user-input-dto';
import { CreateUserCommand } from '../application/usecases/create-user.usecase';
import { UsersQueryRepository } from '../infra/query/users.query-repository';
import { DeleteUserCommand } from '../application/usecases/delete-user.usecase';
import { UsersViewDto } from './view-dto/users.view-dto';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';

@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private userQueryRepository: UsersQueryRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(BasicAuthGuard)
  async createUser(@Body() dto: CreateUserInputDto): Promise<UsersViewDto> {
    const createdUserId = await this.commandBus.execute<
      CreateUserCommand,
      number
    >(new CreateUserCommand(dto));

    return await this.userQueryRepository.findUserByIdOrNotFoundFail(
      createdUserId,
    );
  }

  @ApiParam({ name: 'id' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async deleteUserById(@Param() { id }: IdNumberParamDto) {
    return this.commandBus.execute<DeleteUserCommand, void>(
      new DeleteUserCommand(id),
    );
  }
}
