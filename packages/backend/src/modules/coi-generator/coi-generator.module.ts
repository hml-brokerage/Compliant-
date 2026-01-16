import { Module } from '@nestjs/common';
import { COIGeneratorService } from './coi-generator.service';
import { COIGeneratorController } from './coi-generator.controller';
import { PrismaService } from '../config/prisma.service';

@Module({
  controllers: [COIGeneratorController],
  providers: [COIGeneratorService, PrismaService],
  exports: [COIGeneratorService],
})
export class COIGeneratorModule {}
