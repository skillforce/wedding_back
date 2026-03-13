import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  AGE_GROUPS,
  AgeGroup,
  PERSONALITY_TYPES,
  PersonalityType,
  RELATIONSHIP_TO_COUPLE_VALUES,
  RelationshipToCouple,
} from '../../domain/enteties/guest-form.entity';

export class UpdateGuestFormInputDto {
  @ApiPropertyOptional({ enum: RELATIONSHIP_TO_COUPLE_VALUES })
  @IsOptional()
  @IsEnum(RELATIONSHIP_TO_COUPLE_VALUES)
  relationship_to_couple?: RelationshipToCouple;

  @ApiPropertyOptional({ enum: AGE_GROUPS })
  @IsOptional()
  @IsEnum(AGE_GROUPS)
  age_group?: AgeGroup;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  has_kids_attending?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.has_kids_attending === true)
  @IsInt()
  @Min(1)
  @Max(10)
  amount_of_kids?: number | null;

  @ApiPropertyOptional({ enum: PERSONALITY_TYPES })
  @IsOptional()
  @IsEnum(PERSONALITY_TYPES)
  personality_type?: PersonalityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vip_parents?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vip_grandparents?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vip_relatives?: boolean;
}