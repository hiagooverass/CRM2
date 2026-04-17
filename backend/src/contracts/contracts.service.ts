import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContractDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Rule: Score defines approval
    let status = 'PENDENTE';
    if (client.classification === 'BLOQUEADO' || client.score < 30) {
      status = 'REPROVADO';
    } else if (client.score >= 70) {
      status = 'APROVADO';
    }

    return this.prisma.contract.create({
      data: {
        clientId: dto.clientId,
        value: dto.value,
        status,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async findAll() {
    return this.prisma.contract.findMany({
      include: { client: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.contract.findUnique({
      where: { id },
      include: { client: true, billings: true },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.contract.update({
      where: { id },
      data: { status },
    });
  }
}
