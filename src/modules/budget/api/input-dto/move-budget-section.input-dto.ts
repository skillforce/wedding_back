import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class MoveBudgetSectionInputDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  sectionId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  targetIndex: number;
}
