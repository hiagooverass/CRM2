import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123.456.789-00' })
  @IsNotEmpty()
  document: string;

  @ApiProperty({ example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

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
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'newpassword123', required: false })
  @IsOptional()
  @MinLength(6)
  password?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com ou 123.456.789-00' })
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  password: string;
}
