import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';
import {
  loginConstraints,
  passwordConstraints,
} from '../../domain/entities/user.entity';

export class CreateUserInputDto {
  @IsFieldExistAndStringWithTrim(
    'login',
    loginConstraints.minLength,
    loginConstraints.maxLength,
  )
  login: string;

  @IsFieldExistAndStringWithTrim(
    'password',
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  password: string;
}
