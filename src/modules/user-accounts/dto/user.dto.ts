import { UserRole } from '../domain/entities/user-role.enum';

export class UserDto {
  login: string;
  password: string;
  role?: UserRole;
}
