import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExtractFromDocumentDto {
  @ApiProperty({ description: 'File ID to extract data from' })
  @IsString()
  fileId: string;
}
