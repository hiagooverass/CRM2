import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string) {
    const totalClients = await this.prisma.client.count();
    const totalContractsValue = await this.prisma.contract.aggregate({
      _sum: { value: true },
    });

    const billingsByStatus = await this.prisma.billing.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    const clientsByType = await this.prisma.client.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    const scoreClassification = await this.prisma.client.groupBy({
      by: ['classification'],
      _count: { id: true },
    });

    return {
      totalClients,
      totalContractsValue: totalContractsValue._sum.value || 0,
      billingsByStatus,
      clientsByType,
      scoreClassification,
    };
  }
}
