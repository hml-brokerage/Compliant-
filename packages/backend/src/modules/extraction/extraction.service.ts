import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { AIService } from '../ai/ai.service';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  async extractFromDocument(fileId: string): Promise<any> {
    try {
      this.logger.log(`Starting extraction for document: ${fileId}`);

      // Use AI service to extract insurance data
      const aiAnalysis = await this.aiService.extractInsuranceData(fileId);

      // Determine if manual review is needed based on confidence
      const avgConfidence = aiAnalysis.confidence || 0;
      const needsReview = avgConfidence < 0.85;

      // Store extraction result
      const extractionResult = await this.prisma.extractionResult.create({
        data: {
          documentId: fileId,
          extractionType: 'insurance_data',
          extractedData: aiAnalysis.extractedData,
          confidence: avgConfidence,
          needsReview,
        },
      });

      this.logger.log(
        `Extraction completed for ${fileId}. Confidence: ${avgConfidence.toFixed(2)}, Needs Review: ${needsReview}`,
      );

      return extractionResult;
    } catch (error) {
      this.logger.error(`Extraction failed for ${fileId}: ${error.message}`);
      throw error;
    }
  }

  async getExtractionResults(documentId: string): Promise<any[]> {
    return this.prisma.extractionResult.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateExtraction(extractionId: string, corrections: any, reviewedBy: string): Promise<any> {
    return this.prisma.extractionResult.update({
      where: { id: extractionId },
      data: {
        corrections,
        reviewedBy,
        reviewedAt: new Date(),
        needsReview: false,
      },
    });
  }

  async getPendingReviews(): Promise<any[]> {
    return this.prisma.extractionResult.findMany({
      where: { needsReview: true },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }
}
