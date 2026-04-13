import { UserRole } from '../../domain/entities/user-role.enum';

export class UserContextDto {
  id: number;
  sessionId: string;
  role: UserRole;
  exp?: number;
}
