import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingDoc = await this.prisma.user.findUnique({
      where: { document: dto.document },
    });
    if (existingDoc) {
      throw new ConflictException('Document already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        document: dto.document,
        phone: dto.phone,
        cep: dto.cep,
        street: dto.street,
        number: dto.number,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
        role: 'USER',
      },
    });

    // Criar automaticamente um registro de cliente para este usuário
    await this.prisma.client.create({
      data: {
        type: dto.document.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ',
        name: dto.name,
        document: dto.document,
        email: dto.email,
        phone: dto.phone,
        address: dto.street ? `${dto.street}, ${dto.number || 'S/N'}` : null,
        userId: user.id, // Vincula o cliente ao usuário recém-criado
      },
    });

    return this.generateToken(user.id, user.email, user.role, user.name);
  }

  async login(dto: LoginDto) {
    // Busca por email ou documento
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.identifier },
          { document: dto.identifier },
        ],
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user.id, user.email, user.role, user.name);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: any = {};
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
      data.email = dto.email;
    }
    if (dto.name) data.name = dto.name;
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.generateToken(updatedUser.id, updatedUser.email, updatedUser.role, updatedUser.name);
  }

  private generateToken(userId: string, email: string, role: string, name: string) {
    const payload = { sub: userId, email, role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userId,
        email,
        role,
        name,
      },
    };
  }
}
