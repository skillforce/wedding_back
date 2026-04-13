import { UserRole } from '../entities/user-role.enum';

export class CreateUserDomainDto {
  login: string;
  passwordHash: string;
  role: UserRole;
  createdByUserId: number | null;
}
