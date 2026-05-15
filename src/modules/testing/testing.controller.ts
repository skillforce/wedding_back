import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { SkipThrottle } from '@nestjs/throttler';
import { CommandBus } from '@nestjs/cqrs';
import { CreatePlainUserCommand } from '../user-accounts/application/usecases/create-plain-user.usecase';
import { ConfirmEmailCommand } from '../user-accounts/application/usecases/confirm-email.usecase';
import { Confirmation, ConfirmationType } from '../user-accounts/domain/entities/confirmation.entity';
import { CreateActivatedPlainUserInputDto } from './api/input-dto/create-activated-plain-user.input-dto';

@Controller('testing')
export class TestingController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Confirmation)
    private readonly confirmationRepository: Repository<Confirmation>,
    private readonly commandBus: CommandBus,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle()
  async deleteAllData() {
    await this.dataSource.query('TRUNCATE TABLE "Users" CASCADE');
    return {
      status: 'succeeded',
    };
  }

  @Post('users/plain')
  @HttpCode(HttpStatus.CREATED)
  @SkipThrottle()
  async createActivatedPlainUser(@Body() dto: CreateActivatedPlainUserInputDto) {
    const userId = await this.commandBus.execute<CreatePlainUserCommand, number>(
      new CreatePlainUserCommand(
        { login: dto.login, email: dto.email },
        dto.creatorUserId,
      ),
    );

    const confirmation = await this.confirmationRepository.findOne({
      where: { userId, type: ConfirmationType.EMAIL_CONFIRMATION, confirmedAt: IsNull() },
    });

    await this.commandBus.execute(new ConfirmEmailCommand(confirmation!.token, dto.password));

    return { id: userId };
  }
}