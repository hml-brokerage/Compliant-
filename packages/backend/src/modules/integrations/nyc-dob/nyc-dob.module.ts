import { Module } from '@nestjs/common';
import { NYCDOBService } from './nyc-dob.service';
import { NYCDOBController } from './nyc-dob.controller';
import { PrismaService } from '../../../config/prisma.service';

@Module({
  controllers: [NYCDOBController],
  providers: [NYCDOBService, PrismaService],
  exports: [NYCDOBService],
})
export class NYCDOBModule {}
