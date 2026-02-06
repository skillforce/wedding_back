import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';
import { guestNameConstraints } from '../../domain/enteties/guest.entity';

export class CreateGuestInputDto {
  @IsFieldExistAndStringWithTrim(
    'login',
    guestNameConstraints.minLength,
    guestNameConstraints.maxLength,
  )
  guest_name: string;

  @IsNumber()
  user_id: number;

  @IsArray()
  @IsNotEmpty()
  preferred_drinks: string[];

  @IsOptional()
  @IsString()
  other_preferences?: string;
}
