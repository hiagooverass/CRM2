import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BillingsService {
  private readonly logger = new Logger(BillingsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBillingDto) {
    return this.prisma.billing.create({
      data: {
        userId,
        clientId: dto.clientId,
        contractId: dto.contractId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        status: 'PENDENTE',
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.billing.findMany({
      include: { client: true, contract: true },
      orderBy: { dueDate: 'asc' }
    });
  }

  async findOne(userId: string, id: string) {
    return this.prisma.billing.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { userId: null }
        ]
      },
      include: { client: true, contract: true },
    });
  }

  async markAsPaid(userId: string, id: string) {
    // 1. Buscar a cobrança atual para saber o contrato e a data de vencimento
    const currentBilling = await this.prisma.billing.findUnique({
      where: { id },
      include: { contract: true },
    });

    if (!currentBilling) {
      throw new NotFoundException('Cobrança não encontrada');
    }

    // 2. Se a cobrança estiver vinculada a um contrato, verificar parcelas anteriores
    if (currentBilling.contractId) {
      // Usar a data exata da cobrança atual para a comparação
      const currentDueDate = currentBilling.dueDate;

      const previousPending = await this.prisma.billing.findFirst({
        where: {
          contractId: currentBilling.contractId,
          status: { not: 'PAGO' },
          id: { not: id }, // Garantir que não está comparando com ela mesma
          dueDate: {
            lt: currentDueDate,
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      if (previousPending) {
        throw new BadRequestException(
          `Não é possível pagar esta parcela pois existem parcelas anteriores pendentes (Vencimento: ${previousPending.dueDate.toLocaleDateString('pt-BR')}).`
        );
      }
    }

    return this.prisma.billing.update({
      where: { id },
      data: {
        status: 'PAGO',
        paidDate: new Date(),
      },
    });
  }

  async revertPayment(userId: string, id: string) {
    return this.prisma.billing.update({
      where: { id },
      data: {
        status: 'PENDENTE',
        paidDate: null,
      },
    });
  }

  // Cron Job to update status to ATRASADO
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Running Cron Job: Updating billing statuses...');
    
    const now = new Date();
    
    const updated = await this.prisma.billing.updateMany({
      where: {
        status: 'PENDENTE',
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: 'ATRASADO',
      },
    });

    this.logger.debug(`Updated ${updated.count} billings to ATRASADO status.`);
  }
}
