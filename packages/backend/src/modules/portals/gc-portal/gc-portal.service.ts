import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class GCPortalService {
  private readonly logger = new Logger(GCPortalService.name);

  constructor(private prisma: PrismaService) {}

  private generateAccessCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  async createAccess(contractorId: string): Promise<any> {
    const existingAccess = await this.prisma.gCPortalAccess.findUnique({
      where: { contractorId },
    });

    if (existingAccess) {
      return existingAccess;
    }

    const accessCode = this.generateAccessCode();

    return this.prisma.gCPortalAccess.create({
      data: {
        contractorId,
        accessCode,
        enabled: true,
      },
      include: {
        contractor: true,
      },
    });
  }

  async validateAccessCode(accessCode: string): Promise<any> {
    const access = await this.prisma.gCPortalAccess.findUnique({
      where: { accessCode },
      include: {
        contractor: {
          include: {
            generatedCOIs: {
              where: { status: 'ISSUED' },
              orderBy: { generatedAt: 'desc' },
            },
            coiReviews: {
              orderBy: { createdAt: 'desc' },
              include: {
                deficiencies: true,
              },
            },
          },
        },
      },
    });

    if (!access || !access.enabled) {
      throw new NotFoundException('Invalid or disabled access code');
    }

    // Update last access
    await this.prisma.gCPortalAccess.update({
      where: { accessCode },
      data: { lastAccess: new Date() },
    });

    return access;
  }

  async getContractorInfo(accessCode: string): Promise<any> {
    const access = await this.validateAccessCode(accessCode);
    return access.contractor;
  }

  async disableAccess(contractorId: string): Promise<any> {
    return this.prisma.gCPortalAccess.update({
      where: { contractorId },
      data: { enabled: false },
    });
  }

  async enableAccess(contractorId: string): Promise<any> {
    return this.prisma.gCPortalAccess.update({
      where: { contractorId },
      data: { enabled: true },
    });
  }

  async regenerateAccessCode(contractorId: string): Promise<any> {
    const newAccessCode = this.generateAccessCode();

    return this.prisma.gCPortalAccess.update({
      where: { contractorId },
      data: { accessCode: newAccessCode },
      include: {
        contractor: true,
      },
    });
  }
}
