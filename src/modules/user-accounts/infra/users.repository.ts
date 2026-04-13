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
    return await this.usersOrmRepository.findOneBy({ login });
  }

  async findUserById(id: number): Promise<User | null> {
    return await this.usersOrmRepository.findOneBy({ id });
  }

  async save(user: Partial<User>): Promise<number> {
    const result = await this.usersOrmRepository.save(user);
    return result.id;
  }

  async deleteUserById(id: number): Promise<boolean> {
    const result = await this.usersOrmRepository.delete(id);
    return result.affected === 1;
  }
}