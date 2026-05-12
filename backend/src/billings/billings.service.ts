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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user?.role === 'ADMIN') {
      // Para o Administrador, mostramos absolutamente todas as cobranças do banco
      return this.prisma.billing.findMany({
        include: { client: true, contract: true },
        orderBy: { dueDate: 'asc' }
      });
    }

    // Se for USER (Cliente), busca cobranças onde ele é o cliente (pelo documento)
    return this.prisma.billing.findMany({
      where: {
        client: {
          document: user?.document || '---'
        }
      },
      include: { client: true, contract: true },
      orderBy: { dueDate: 'asc' }
    });
  }

  async findOne(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user?.role === 'ADMIN') {
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

    return this.prisma.billing.findFirst({
      where: {
        id,
        client: {
          document: user?.document || '---'
        }
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
      const currentDueDate = currentBilling.dueDate;

      const previousPending = await this.prisma.billing.findFirst({
        where: {
          contractId: currentBilling.contractId,
          status: { not: 'PAGO' },
          id: { not: id },
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

    // 3. Atualizar a cobrança para PAGO
    const updatedBilling = await this.prisma.billing.update({
      where: { id },
      data: {
        status: 'PAGO',
        paidDate: new Date(),
      },
    });

    // 4. Se houver um contrato, verificar se TODAS as parcelas foram pagas para atualizar o status do contrato
    if (currentBilling.contractId) {
      const remainingPending = await this.prisma.billing.count({
        where: {
          contractId: currentBilling.contractId,
          status: { not: 'PAGO' },
        },
      });

      if (remainingPending === 0) {
        await this.prisma.contract.update({
          where: { id: currentBilling.contractId },
          data: { status: 'PAGO' },
        });
      }
    }

    return updatedBilling;
  }

  async revertPayment(userId: string, id: string) {
    const billing = await this.prisma.billing.findUnique({
      where: { id },
    });

    const updatedBilling = await this.prisma.billing.update({
      where: { id },
      data: {
        status: 'PENDENTE',
        paidDate: null,
      },
    });

    // Se a cobrança pertence a um contrato que estava como PAGO, volta para APROVADO (Ativo)
    if (billing?.contractId) {
      const contract = await this.prisma.contract.findUnique({
        where: { id: billing.contractId },
      });

      if (contract?.status === 'PAGO') {
        await this.prisma.contract.update({
          where: { id: billing.contractId },
          data: { status: 'APROVADO' },
        });
      }
    }

    return updatedBilling;
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
