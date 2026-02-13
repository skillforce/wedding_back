import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { LoginInputDto } from './input-dto/auth-input-dto';
import { ExtractUserFromRequest } from '../guards/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { LoginUserCommand } from '../application/usecases/login-user.usecase';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { UsersQueryRepository } from '../infra/query/users.query-repository';
import { MeViewDto } from './view-dto/auth-view-dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(
    @Body() _: LoginInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
    @Res({ passthrough: true })
    res: Response,
  ) {
    return this.commandBus.execute<LoginUserCommand, { accessToken: string }>(
      new LoginUserCommand(user.id),
    );
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async me(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<MeViewDto> {
    return this.usersQueryRepository.findMeByIdOrNotFoundFail(user.id);
  }
}
