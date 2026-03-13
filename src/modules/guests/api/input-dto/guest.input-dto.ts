import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';
import { guestNameConstraints } from '../../domain/enteties/guest.entity';
import {
  AGE_GROUPS,
  AgeGroup,
  PERSONALITY_TYPES,
  PersonalityType,
  RELATIONSHIP_TO_COUPLE_VALUES,
  RelationshipToCouple,
} from '../../domain/enteties/guest-form.entity';

export class GuestFormInputDto {
  @ApiProperty({ enum: RELATIONSHIP_TO_COUPLE_VALUES })
  @IsEnum(RELATIONSHIP_TO_COUPLE_VALUES)
  relationship_to_couple: RelationshipToCouple;

  @ApiProperty({ enum: AGE_GROUPS })
  @IsEnum(AGE_GROUPS)
  age_group: AgeGroup;

  @ApiProperty()
  @IsBoolean()
  has_kids_attending: boolean;

  @ApiProperty({ nullable: true })
  @ValidateIf((o) => o.has_kids_attending === true)
  @IsInt()
  @Min(1)
  @Max(10)
  amount_of_kids: number | null;

  @ApiProperty({ enum: PERSONALITY_TYPES })
  @IsEnum(PERSONALITY_TYPES)
  personality_type: PersonalityType;

  @ApiProperty()
  @IsBoolean()
  vip_parents: boolean;

  @ApiProperty()
  @IsBoolean()
  vip_grandparents: boolean;

  @ApiProperty()
  @IsBoolean()
  vip_relatives: boolean;
}

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

  @ApiProperty({
    description: 'ID of the user this guest belongs to',
    example: 1,
  })
  @IsNumber()
  user_id: number;

  @ApiPropertyOptional({ type: GuestFormInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuestFormInputDto)
  guestForm?: GuestFormInputDto;
}
