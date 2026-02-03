import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../domain/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private usersOrmRepository: Repository<User>,
  ) {}

  async findUserByLogin(login: string): Promise<User | null> {
    return await this.usersOrmRepository.findOneBy({
      login,
    });
  }
}
