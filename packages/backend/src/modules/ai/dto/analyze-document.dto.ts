import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeDocumentDto {
  @ApiProperty({ description: 'File ID to analyze' })
  @IsString()
  fileId: string;

  @ApiProperty({ description: 'Analysis type', required: false })
  @IsOptional()
  @IsString()
  analysisType?: string;
}

export class ExtractDataDto {
  @ApiProperty({ description: 'Text content to extract data from' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Extraction type', required: false })
  @IsOptional()
  @IsString()
  extractionType?: string;
}
