import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGuestResponseInputDto {
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

  @ApiProperty({
    description: 'Whether the guest is bringing a plus one',
    example: false,
  })
  @IsBoolean()
  plus_one: boolean;

  @ApiProperty({
    description: 'Name of the plus one (required if plus_one is true)',
    required: false,
    example: 'Jane Doe',
  })
  @ValidateIf((o) => o.plus_one === true)
  @IsString()
  @IsNotEmpty()
  plus_one_name?: string;
}