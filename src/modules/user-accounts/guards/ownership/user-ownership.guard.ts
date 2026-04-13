import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Request } from 'express';
import { UserContextDto } from '../dto/user-context.dto';
import { ValidateUserOwnershipCommand } from '../../application/usecases/validate-user-ownership.usecase';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  constructor(private readonly commandBus: CommandBus) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user: UserContextDto; effectiveUserId: number }>();
    const user = request.user;

    const raw = request.query?.userId;
    const targetUserId = raw !== undefined ? parseInt(raw as string, 10) : undefined;

    request.effectiveUserId = await this.commandBus.execute<ValidateUserOwnershipCommand, number>(
      new ValidateUserOwnershipCommand(user.id, user.role, targetUserId),
    );

    return true;
  }
}