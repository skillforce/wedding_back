import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
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