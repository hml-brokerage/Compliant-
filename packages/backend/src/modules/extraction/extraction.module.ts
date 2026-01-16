import { Module } from '@nestjs/common';
import { ExtractionService } from './extraction.service';
import { ExtractionController } from './extraction.controller';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../config/prisma.service';

@Module({
  imports: [AIModule],
  controllers: [ExtractionController],
  providers: [ExtractionService, PrismaService],
  exports: [ExtractionService],
})
export class ExtractionModule {}
