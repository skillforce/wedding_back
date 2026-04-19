import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import { TrimAndNullifyEmpty } from '../../../../core/decorators/transform/trim-and-nullify-empty';
import { ScenarioPointIcon } from '../../domain/entities/scenario-point.entity';
import { SCENARIO_TIME_REGEX } from '../validation/scenario.regex';

export class UpdateScenarioPointInputDto {
  @ApiProperty({ example: '14:30', required: false })
  @IsOptional()
  @IsString()
  @Matches(SCENARIO_TIME_REGEX)
  time?: string;

  @ApiProperty({ example: 'Ceremony', maxLength: 50, required: false })
  @IsOptional()
  @IsString()
  @Trim()
  @Length(1, 50)
  title?: string;

  @ApiProperty({ enum: ScenarioPointIcon, required: false })
  @IsOptional()
  @IsEnum(ScenarioPointIcon)
  icon?: ScenarioPointIcon;

  @ApiProperty({ example: '', required: false, nullable: true, maxLength: 50 })
  @IsOptional()
  @TrimAndNullifyEmpty()
  @IsString()
  @Length(0, 50)
  note?: string | null;

  @ApiProperty({ example: 30, required: false, nullable: true, description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number | null;
}