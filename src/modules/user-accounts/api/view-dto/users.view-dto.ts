import { User } from '../../domain/entities/user.entity';

export class UsersViewDto {
  id: number;
  login: string;

  static mapToViewDto(user: User): UsersViewDto {
    const dto = new UsersViewDto();

    dto.id = user.id;
    dto.login = user.login;

    return dto;
  }
}
