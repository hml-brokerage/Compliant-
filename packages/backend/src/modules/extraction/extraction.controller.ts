import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExtractionService } from './extraction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExtractFromDocumentDto } from './dto/extraction-result.dto';

@ApiTags('extraction')
@Controller('extraction')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Post('extract')
  async extractFromDocument(@Body() dto: ExtractFromDocumentDto) {
    return this.extractionService.extractFromDocument(dto.fileId);
  }

  @Get('document/:documentId')
  async getExtractionResults(@Param('documentId') documentId: string) {
    return this.extractionService.getExtractionResults(documentId);
  }

  @Get('pending-reviews')
  async getPendingReviews() {
    return this.extractionService.getPendingReviews();
  }

  @Patch(':id/review')
  async reviewExtraction(
    @Param('id') id: string,
    @Body() corrections: any,
    @Request() req,
  ) {
    return this.extractionService.updateExtraction(id, corrections, req.user.userId);
  }
}
