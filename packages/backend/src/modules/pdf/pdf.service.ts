import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';
import { PdfExtractionResult, PdfMetadata } from './interfaces/pdf-metadata.interface';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async extractText(fileId: string): Promise<PdfExtractionResult> {
    try {
      this.logger.log(`Extracting text from PDF file: ${fileId}`);

      // Get file from database
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('File not found');
      }

      if (file.mimeType !== 'application/pdf') {
        throw new BadRequestException('File is not a PDF');
      }

      // Read PDF file
      const dataBuffer = fs.readFileSync(file.path);

      // Parse PDF
      const data = await pdfParse(dataBuffer);

      // Extract metadata
      const metadata: PdfMetadata = {
        pageCount: data.numpages,
        title: data.info?.Title,
        author: data.info?.Author,
        creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
        modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined,
        format: data.info?.PDFFormatVersion,
        encrypted: data.info?.IsEncrypted === 'yes',
        fileSize: file.size,
      };

      // Extract text by page (pdf-parse doesn't separate by page easily, so we'll use full text)
      const pages = [
        {
          pageNumber: 1,
          text: data.text,
        },
      ];

      const result: PdfExtractionResult = {
        text: data.text,
        metadata,
        pages,
      };

      this.logger.log(`Successfully extracted text from PDF: ${fileId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error extracting PDF text: ${error.message}`);
      throw error;
    }
  }

  async validatePdf(fileId: string): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        return { valid: false, errors: ['File not found'] };
      }

      if (file.mimeType !== 'application/pdf') {
        return { valid: false, errors: ['File is not a PDF'] };
      }

      // Try to parse the PDF
      const dataBuffer = fs.readFileSync(file.path);
      await pdfParse(dataBuffer);

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
      };
    }
  }

  async getPdfMetadata(fileId: string): Promise<PdfMetadata> {
    const extraction = await this.extractText(fileId);
    return extraction.metadata;
  }
}
