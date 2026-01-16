import { Module } from '@nestjs/common';
import { BrokerPortalService } from './broker-portal.service';
import { BrokerPortalController } from './broker-portal.controller';
import { PrismaService } from '../../../config/prisma.service';

@Module({
  controllers: [BrokerPortalController],
  providers: [BrokerPortalService, PrismaService],
  exports: [BrokerPortalService],
})
export class BrokerPortalModule {}
