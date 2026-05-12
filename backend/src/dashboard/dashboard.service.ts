import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'ADMIN';

    const totalClients = await this.prisma.client.count({
      where: isAdmin ? {} : { document: user?.document || '---' }
    });

    const totalContractsValue = await this.prisma.contract.aggregate({
      where: isAdmin ? {} : { client: { document: user?.document || '---' } },
      _sum: { value: true },
    });

    const billingsByStatus = await this.prisma.billing.groupBy({
      by: ['status'],
      where: isAdmin ? {} : { client: { document: user?.document || '---' } },
      _count: { id: true },
      _sum: { amount: true },
    });

    const clientsByType = await this.prisma.client.groupBy({
      by: ['type'],
      where: isAdmin ? {} : { document: user?.document || '---' },
      _count: { id: true },
    });

    const scoreClassification = await this.prisma.client.groupBy({
      by: ['classification'],
      where: isAdmin ? {} : { document: user?.document || '---' },
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
