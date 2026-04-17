import { IsNotEmpty, IsNumber, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBillingDto {
  @ApiProperty({ example: 'client-uuid-here' })
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 'contract-uuid-here' })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiProperty({ example: 500.00 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2026-05-16' })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;
}
