import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ClientType {
  PF = 'PF',
  PJ = 'PJ',
}

export class CreateClientDto {
  @ApiProperty({ enum: ClientType })
  @IsEnum(ClientType)
  type: ClientType;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '12345678901' })
  @IsNotEmpty()
  @IsString()
  document: string; // CPF or CNPJ

  @ApiProperty({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Rua das Flores, 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '01001-000' })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiProperty({ example: 'Rua Exemplo' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ example: '123' })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiProperty({ example: 'Bairro' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'SP' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: 'password123' })
  @IsOptional()
  @IsString()
  password?: string;

  // PF fields
  @ApiProperty({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  // PJ fields (can be auto-filled from CNPJa)
  @ApiProperty({ example: 'Company Name LTDA' })
  @IsOptional()
  @IsString()
  tradingName?: string;

  @ApiProperty({ example: 'Sociedade Limitada' })
  @IsOptional()
  @IsString()
  legalNature?: string;

  @ApiProperty({ example: '2020-01-01' })
  @IsOptional()
  @IsDateString()
  foundationDate?: string;
}

export class UpdateClientDto extends CreateClientDto {}
