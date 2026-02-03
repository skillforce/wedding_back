import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';

export class LoginInputDto {
  @IsFieldExistAndStringWithTrim('login')
  login: string;

  @IsFieldExistAndStringWithTrim('password')
  password: string;
}
