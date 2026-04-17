import { IsNotEmpty, IsNumber, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({ example: 'client-uuid-here' })
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 5000.00 })
  @IsNotEmpty()
  @IsNumber()
  value: number;

  @ApiProperty({ example: '2026-04-16' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2027-04-16' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
