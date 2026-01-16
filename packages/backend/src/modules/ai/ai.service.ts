import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { PdfService } from '../pdf/pdf.service';
import {
  EXTRACT_INSURANCE_DATA_PROMPT,
  CLASSIFY_DOCUMENT_PROMPT,
  VALIDATE_COVERAGE_PROMPT,
} from './prompts/insurance-prompts';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly provider: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private openaiProvider: OpenAIProvider,
    private claudeProvider: ClaudeProvider,
    private pdfService: PdfService,
  ) {
    this.provider = this.configService.get<string>('AI_PROVIDER', 'openai');
  }

  async analyzeDocument(fileId: string, analysisType: string = 'extract'): Promise<any> {
    const startTime = Date.now();

    try {
      // Extract text from PDF
      const pdfExtraction = await this.pdfService.extractText(fileId);
      const text = pdfExtraction.text;

      // Select prompt based on analysis type
      let prompt: string;
      switch (analysisType) {
        case 'extract':
          prompt = EXTRACT_INSURANCE_DATA_PROMPT;
          break;
        case 'classify':
          prompt = CLASSIFY_DOCUMENT_PROMPT;
          break;
        case 'validate':
          prompt = VALIDATE_COVERAGE_PROMPT;
          break;
        default:
          prompt = EXTRACT_INSURANCE_DATA_PROMPT;
      }

      // Analyze with AI provider
      const result = await this.analyzeWithProvider(prompt, text);

      const processingTime = Date.now() - startTime;

      // Parse JSON response
      let extractedData;
      try {
        extractedData = JSON.parse(result.response);
      } catch (error) {
        this.logger.warn('Failed to parse AI response as JSON');
        extractedData = { raw: result.response };
      }

      // Calculate average confidence
      const confidence = this.calculateConfidence(extractedData);

      // Store analysis in database
      const analysis = await this.prisma.aIAnalysis.create({
        data: {
          documentId: fileId,
          provider: this.provider,
          model: this.configService.get<string>('AI_MODEL', 'gpt-4'),
          prompt,
          response: extractedData,
          tokensUsed: result.tokensUsed,
          cost: result.cost,
          processingTime,
          confidence,
          extractedData,
        },
      });

      this.logger.log(`Document analysis completed: ${fileId}`);
      return analysis;
    } catch (error) {
      this.logger.error(`Document analysis failed: ${error.message}`);
      throw error;
    }
  }

  async extractInsuranceData(fileId: string): Promise<any> {
    return this.analyzeDocument(fileId, 'extract');
  }

  async classifyDocument(fileId: string): Promise<any> {
    return this.analyzeDocument(fileId, 'classify');
  }

  async validateCoverage(fileId: string): Promise<any> {
    return this.analyzeDocument(fileId, 'validate');
  }

  private async analyzeWithProvider(prompt: string, text: string): Promise<{ response: string; tokensUsed: number; cost: number }> {
    if (this.provider === 'claude') {
      return this.claudeProvider.analyze(prompt, text);
    } else {
      return this.openaiProvider.analyze(prompt, text);
    }
  }

  private calculateConfidence(data: any): number {
    if (!data || typeof data !== 'object') {
      return 0;
    }

    const confidenceValues: number[] = [];

    for (const key in data) {
      if (data[key] && typeof data[key] === 'object' && 'confidence' in data[key]) {
        confidenceValues.push(data[key].confidence);
      }
    }

    if (confidenceValues.length === 0) {
      return data.confidence || 0.5;
    }

    return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
  }

  async getAnalysisHistory(documentId: string): Promise<any[]> {
    return this.prisma.aIAnalysis.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
