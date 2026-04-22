import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string) {
    const totalClients = await this.prisma.client.count({
      where: { userId }
    });
    const totalContractsValue = await this.prisma.contract.aggregate({
      where: { userId },
      _sum: { value: true },
    });

    const billingsByStatus = await this.prisma.billing.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
      _sum: { amount: true },
    });

    const clientsByType = await this.prisma.client.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true },
    });

    const scoreClassification = await this.prisma.client.groupBy({
      by: ['classification'],
      where: { userId },
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
