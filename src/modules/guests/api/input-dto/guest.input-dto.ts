import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';
import { guestNameConstraints } from '../../domain/enteties/guest.entity';

export class CreateGuestInputDto {
  @ApiProperty({
    description: 'Name of the guest',
    minLength: guestNameConstraints.minLength,
    maxLength: guestNameConstraints.maxLength,
    example: 'John Doe',
  })
  @IsFieldExistAndStringWithTrim(
    'guest_name',
    guestNameConstraints.minLength,
    guestNameConstraints.maxLength,
  )
  guest_name: string;

  @ApiProperty({ description: 'ID of the user this guest belongs to', example: 1 })
  @IsNumber()
  user_id: number;

  @ApiProperty({
    description: 'List of preferred drinks for the guest',
    type: [String],
    example: ['wine', 'juice'],
  })
  @IsArray()
  @IsNotEmpty()
  preferred_drinks: string[];

  @ApiProperty({
    description: 'Additional preferences or notes for the guest',
    required: false,
    example: 'Vegetarian meal',
  })
  @IsOptional()
  @IsString()
  other_preferences?: string;
}