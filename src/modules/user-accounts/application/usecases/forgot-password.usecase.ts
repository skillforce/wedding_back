import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infra/users.repository';
import { SendPasswordResetCommand } from './send-password-reset.usecase';
import { Locale } from '../../../email/templates/password-reset-email.template';

export class ForgotPasswordCommand {
  constructor(
    public readonly email: string,
    public readonly locale: Locale = 'en',
  ) {}
}

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordUseCase implements ICommandHandler<
  ForgotPasswordCommand,
  void
> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ email, locale }: ForgotPasswordCommand): Promise<void> {
    console.log('alala');
    const user = await this.usersRepository.findUserByConfirmedEmail(email);

    if (!user) {
      console.log('alala');
      return;
    }

    await this.commandBus.execute(
      new SendPasswordResetCommand(user.id, email, user.login, locale),
    );
  }
}
