import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BillingsService {
  private readonly logger = new Logger(BillingsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBillingDto) {
    return this.prisma.billing.create({
      data: {
        clientId: dto.clientId,
        contractId: dto.contractId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        status: 'PENDENTE',
      },
    });
  }

  async findAll() {
    return this.prisma.billing.findMany({
      include: { client: true, contract: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.billing.findUnique({
      where: { id },
      include: { client: true, contract: true },
    });
  }

  async markAsPaid(id: string) {
    return this.prisma.billing.update({
      where: { id },
      data: {
        status: 'PAGO',
        paidDate: new Date(),
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
