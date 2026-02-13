import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UsersViewDto } from '../../api/view-dto/users.view-dto';
import { MeViewDto } from '../../api/view-dto/auth-view-dto';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectRepository(User) private usersOrmRepository: Repository<User>,
  ) {}

  async findUserByIdOrNotFoundFail(id: number): Promise<UsersViewDto> {
    const user = await this.usersOrmRepository.findOneBy({
      id,
    });

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'user not found, internal service error',
      });
    }
    return UsersViewDto.mapToViewDto(user);
  }

  async findMeByIdOrNotFoundFail(id: number): Promise<MeViewDto> {
    const user = await this.usersOrmRepository.findOneBy({
      id,
    });

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'user not found, internal service error',
      });
    }

    return MeViewDto.mapToViewDto(user);
  }
}
