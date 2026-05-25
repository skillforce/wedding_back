import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';
import {
  loginConstraints,
  passwordConstraints,
} from '../../domain/entities/user.entity';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../domain/entities/user-role.enum';

export class CreateUserInputDto {
  @ApiProperty({
    description: 'User login',
    minLength: loginConstraints.minLength,
    maxLength: loginConstraints.maxLength,
    example: 'admin',
  })
  @IsFieldExistAndStringWithTrim(
    'login',
    loginConstraints.minLength,
    loginConstraints.maxLength,
  )
  login: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    minLength: passwordConstraints.minLength,
    maxLength: passwordConstraints.maxLength,
    example: 'secret123',
  })
  @IsFieldExistAndStringWithTrim(
    'password',
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  password: string;

  @ApiPropertyOptional({
    description: 'User role (defaults to plainUser)',
    enum: UserRole,
    example: UserRole.PLAIN_USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}