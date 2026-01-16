import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExtractPdfTextDto {
  @ApiProperty({ description: 'File ID to extract text from' })
  @IsString()
  fileId: string;
}
