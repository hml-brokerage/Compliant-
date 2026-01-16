import { Module } from '@nestjs/common';
import { GCPortalService } from './gc-portal.service';
import { GCPortalController } from './gc-portal.controller';
import { PrismaService } from '../../../config/prisma.service';

@Module({
  controllers: [GCPortalController],
  providers: [GCPortalService, PrismaService],
  exports: [GCPortalService],
})
export class GCPortalModule {}
