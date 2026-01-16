import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getSettings(): Promise<any[]> {
    return this.prisma.adminSettings.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async getSetting(key: string): Promise<any> {
    return this.prisma.adminSettings.findUnique({
      where: { key },
    });
  }

  async updateSetting(key: string, value: string, updatedBy: string, description?: string): Promise<any> {
    return this.prisma.adminSettings.upsert({
      where: { key },
      update: {
        value,
        updatedBy,
        description,
      },
      create: {
        key,
        value,
        updatedBy,
        description,
      },
    });
  }

  async deleteSetting(key: string): Promise<any> {
    return this.prisma.adminSettings.delete({
      where: { key },
    });
  }

  async getDashboardStats(): Promise<any> {
    const [
      totalUsers,
      totalContractors,
      activeReviews,
      openDeficiencies,
      expiringCOIs,
      pendingApprovals,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.contractor.count(),
      this.prisma.cOIReview.count({
        where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
      }),
      this.prisma.deficiency.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.generatedCOI.count({
        where: {
          status: 'ISSUED',
          expirationDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.generatedCOI.count({
        where: { status: 'PENDING_APPROVAL' },
      }),
    ]);

    return {
      totalUsers,
      totalContractors,
      activeReviews,
      openDeficiencies,
      expiringCOIs,
      pendingApprovals,
    };
  }

  async getSystemHealth(): Promise<any> {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}
