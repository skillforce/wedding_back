import { ApiProperty } from '@nestjs/swagger';
import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';
import {
  loginConstraints,
  passwordConstraints,
} from '../../domain/entities/user.entity';

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
}