import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class MoveItemInputDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID('4')
  itemId: string;

  @ApiProperty({ example: '22222222-2222-2222-2222-222222222222' })
  @IsUUID('4')
  targetPhaseId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  targetIndex: number;
}
