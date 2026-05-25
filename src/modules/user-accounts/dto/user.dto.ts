import { UserRole } from '../domain/entities/user-role.enum';

export class UserDto {
  login: string;
  email: string;
  password: string;
  role?: UserRole;
}
