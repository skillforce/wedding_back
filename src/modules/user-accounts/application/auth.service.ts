import { Injectable } from '@nestjs/common';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { BcryptService } from './bcrypt.service';
import { UsersRepository } from '../infra/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async validateUser(
    login: string,
    password: string,
  ): Promise<UserContextDto | null> {
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

    return { id: user.id };
  }
}
