import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class BrokerPortalService {
  private readonly logger = new Logger(BrokerPortalService.name);

  constructor(private prisma: PrismaService) {}

  private generateAccessCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  async createAccess(email: string, companyName: string, permissions?: any): Promise<any> {
    const existingAccess = await this.prisma.brokerPortalAccess.findUnique({
      where: { email },
    });

    if (existingAccess) {
      return existingAccess;
    }

    const accessCode = this.generateAccessCode();

    return this.prisma.brokerPortalAccess.create({
      data: {
        email,
        companyName,
        accessCode,
        permissions,
        enabled: true,
      },
    });
  }

  async validateAccessCode(accessCode: string): Promise<any> {
    const access = await this.prisma.brokerPortalAccess.findUnique({
      where: { accessCode },
    });

    if (!access || !access.enabled) {
      throw new NotFoundException('Invalid or disabled access code');
    }

    // Update last access
    await this.prisma.brokerPortalAccess.update({
      where: { accessCode },
      data: { lastAccess: new Date() },
    });

    return access;
  }

  async getBrokerAccess(email: string): Promise<any> {
    return this.prisma.brokerPortalAccess.findUnique({
      where: { email },
    });
  }

  async getAllBrokerAccess(): Promise<any[]> {
    return this.prisma.brokerPortalAccess.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePermissions(email: string, permissions: any): Promise<any> {
    return this.prisma.brokerPortalAccess.update({
      where: { email },
      data: { permissions },
    });
  }

  async disableAccess(email: string): Promise<any> {
    return this.prisma.brokerPortalAccess.update({
      where: { email },
      data: { enabled: false },
    });
  }

  async enableAccess(email: string): Promise<any> {
    return this.prisma.brokerPortalAccess.update({
      where: { email },
      data: { enabled: true },
    });
  }

  async regenerateAccessCode(email: string): Promise<any> {
    const newAccessCode = this.generateAccessCode();

    return this.prisma.brokerPortalAccess.update({
      where: { email },
      data: { accessCode: newAccessCode },
    });
  }

  async deleteAccess(email: string): Promise<any> {
    return this.prisma.brokerPortalAccess.delete({
      where: { email },
    });
  }
}
