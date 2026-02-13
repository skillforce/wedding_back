import { User } from '../../domain/entities/user.entity';

export class MeViewDto {
  id: number;
  login: string;

  static mapToViewDto(user: User): MeViewDto {
    const dto = new MeViewDto();

    dto.id = user.id;
    dto.login = user.login;

    return dto;
  }
}
