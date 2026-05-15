import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { LoginInputDto } from './input-dto/auth-input-dto';
import { ExtractUserFromRequest } from '../guards/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { UserRefreshContextDto } from '../guards/dto/user-refresh-context.dto';
import { LoginUserCommand } from '../application/usecases/login-user.usecase';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { RefreshTokenGuard } from '../guards/refresh/refresh-token.guard';
import { RefreshTokenCommand } from '../application/usecases/refresh-token.usecase';
import { LogoutCommand } from '../application/usecases/logout.usecase';
import { UsersQueryRepository } from '../infra/query/users.query-repository';
import { MeViewDto } from './view-dto/auth-view-dto';
import { CookieService } from '../application/cookie.service';
import {
  ExtractRequestMetadata,
  RequestMetadata,
} from './decorators/extract-request-metadata.decorator';
import { ListActiveSessionsCommand } from '../application/usecases/list-active-sessions.usecase';
import { RevokeSessionCommand } from '../application/usecases/revoke-session.usecase';
import { RevokeAllOtherSessionsCommand } from '../application/usecases/revoke-all-other-sessions.usecase';
import { SessionViewDto } from './view-dto/session.view-dto';
import { ConfirmEmailCommand } from '../application/usecases/confirm-email.usecase';
import { ConfirmEmailInputDto } from './input-dto/confirm-email.input-dto';
import { ForgotPasswordCommand } from '../application/usecases/forgot-password.usecase';
import { ForgotPasswordInputDto } from './input-dto/forgot-password.input-dto';
import { ResetPasswordCommand } from '../application/usecases/reset-password.usecase';
import { ResetPasswordInputDto } from './input-dto/reset-password.input-dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly cookieService: CookieService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login with login and password' })
  @ApiResponse({
    status: 200,
    description: 'Returns a JWT access token and current user info',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        deviceId: { type: 'string', example: 'a3f1c2d4-...' },
        id: { type: 'number', example: 1 },
        login: { type: 'string', example: 'john' },
        invitationUrl: { type: 'string', nullable: true, example: null },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() _: LoginInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
    @ExtractRequestMetadata() metadata: RequestMetadata,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, deviceId } =
      await this.commandBus.execute<
        LoginUserCommand,
        { accessToken: string; refreshToken: string; deviceId: string }
      >(new LoginUserCommand(user.id, user.role, metadata));

    this.cookieService.setRefreshToken(res, refreshToken);

    const me = await this.usersQueryRepository.findMeByIdOrNotFoundFail(
      user.id,
    );

    return { accessToken, deviceId, ...me };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({
    status: 200,
    description: 'Returns a new JWT access token',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  async refresh(
    @Req() req: Request & { user: UserRefreshContextDto; refreshToken: string },
    @ExtractRequestMetadata() metadata: RequestMetadata,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.commandBus.execute<
      RefreshTokenCommand,
      { accessToken: string; refreshToken: string }
    >(
      new RefreshTokenCommand(
        req.user.id,
        req.user.tokenId,
        req.refreshToken,
        metadata,
      ),
    );

    this.cookieService.setRefreshToken(res, refreshToken);

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuard)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  async logout(
    @Req() req: Request & { user: UserRefreshContextDto },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.commandBus.execute(new LogoutCommand(req.user.tokenId));
    this.cookieService.clearRefreshToken(res);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Current user info',
    type: MeViewDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    return this.usersQueryRepository.findMeByIdOrNotFoundFail(user.id);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active sessions for the current user' })
  @ApiResponse({ status: 200, type: [SessionViewDto] })
  async getSessions(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<SessionViewDto[]> {
    return this.commandBus.execute<ListActiveSessionsCommand, SessionViewDto[]>(
      new ListActiveSessionsCommand(user.id, user.sessionId),
    );
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions except the current one' })
  @ApiResponse({ status: 204 })
  async revokeAllOtherSessions(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new RevokeAllOtherSessionsCommand(user.id, user.sessionId),
    );
  }

  @Post('confirm-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirm user email with token' })
  @ApiResponse({ status: 204, description: 'Email confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async confirmEmail(@Body() dto: ConfirmEmailInputDto): Promise<void> {
    await this.commandBus.execute(
      new ConfirmEmailCommand(dto.token, dto.password),
    );
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: 204,
    description: 'If the email exists, a reset link has been sent',
  })
  async forgotPassword(@Body() dto: ForgotPasswordInputDto): Promise<void> {
    console.log('slalslslsl');
    await this.commandBus.execute(new ForgotPasswordCommand(dto.email));
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Reset password using a token received by email (must be logged in)',
  })
  @ApiResponse({ status: 204, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resetPassword(
    @Body() dto: ResetPasswordInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new ResetPasswordCommand(dto.token, dto.password, user.id),
    );
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session by ID' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeSession(
    @Param('id') sessionId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(new RevokeSessionCommand(sessionId, user.id));
  }
}
