import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class MoveBudgetItemInputDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  itemId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  targetSectionId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  targetIndex: number;
}
