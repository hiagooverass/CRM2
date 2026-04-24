import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateContractDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, userId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado ou não pertence ao seu usuário');
    }

    // Date validation: Start and End dates must be today or in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const normalizeDate = (dateStr: string) => {
      const d = new Date(dateStr);
      // Use the actual date from the string regardless of timezone
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    };

    if (dto.startDate) {
      const startDate = normalizeDate(dto.startDate);
      if (startDate < today) {
        throw new BadRequestException('A data de início não pode ser anterior a hoje');
      }
    }

    if (dto.endDate) {
      const endDate = normalizeDate(dto.endDate);
      if (endDate < today) {
        throw new BadRequestException('A data de vencimento não pode ser anterior a hoje');
      }
      if (dto.startDate) {
        const startDate = normalizeDate(dto.startDate);
        if (endDate < startDate) {
          throw new BadRequestException('A data de vencimento não pode ser anterior à data de início');
        }
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
        userId,
        clientId: dto.clientId,
        value: dto.value,
        status,
        startDate: dto.startDate ? normalizeDate(dto.startDate) : new Date(),
        endDate: dto.endDate ? normalizeDate(dto.endDate) : null,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.contract.findMany({
      where: { userId },
      include: { client: true },
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.contract.findFirst({
      where: { id, userId },
      include: { client: true, billing: true },
    });
  }

  async updateStatus(userId: string, id: string, status: string) {
    return this.prisma.contract.update({
      where: { id, userId },
      data: { status },
    });
  }

  async update(userId: string, id: string, dto: Partial<CreateContractDto>) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, userId },
    });

    if (!contract) {
      throw new NotFoundException('Contrato não encontrado');
    }

    const normalizeDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    };

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = normalizeDate(dto.startDate);
    if (dto.endDate) data.endDate = normalizeDate(dto.endDate);

    return this.prisma.contract.update({
      where: { id, userId },
      data,
    });
  }

  async remove(userId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, userId },
    });

    if (!contract) {
      throw new NotFoundException('Contrato não encontrado');
    }

    return this.prisma.contract.delete({
      where: { id, userId },
    });
  }
}
