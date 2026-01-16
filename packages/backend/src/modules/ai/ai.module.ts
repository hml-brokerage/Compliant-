import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { PdfModule } from '../pdf/pdf.module';
import { PrismaService } from '../config/prisma.service';

@Module({
  imports: [PdfModule],
  providers: [AIService, OpenAIProvider, ClaudeProvider, PrismaService],
  exports: [AIService],
})
export class AIModule {}
