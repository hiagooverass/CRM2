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

    // Date validation: Start and End dates must be today or in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dto.startDate) {
      const startDate = new Date(dto.startDate);
      if (startDate < today) {
        throw new BadRequestException('A data de início não pode ser anterior a hoje');
      }
    }

    if (dto.endDate) {
      const endDate = new Date(dto.endDate);
      if (endDate < today) {
        throw new BadRequestException('A data de vencimento não pode ser anterior a hoje');
      }
      if (dto.startDate && endDate < new Date(dto.startDate)) {
        throw new BadRequestException('A data de vencimento não pode ser anterior à data de início');
      }
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
