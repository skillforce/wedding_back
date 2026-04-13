import { Injectable } from '@nestjs/common';
import { BcryptService } from './bcrypt.service';
import { UsersRepository } from '../infra/users.repository';
import { UserRole } from '../domain/entities/user-role.enum';
import { UserStatus } from '../domain/entities/user-status.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async validateUser(
    login: string,
    password: string,
  ): Promise<{ id: number; role: UserRole } | null> {
    const user = await this.usersRepository.findUserByLogin(login);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.bcryptService.comparePasswords(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return { id: user.id, role: user.role };
  }
}
