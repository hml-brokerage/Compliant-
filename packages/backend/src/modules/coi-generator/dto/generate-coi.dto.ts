import { IsString, IsDateString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateCOIDto {
  @ApiProperty({ description: 'Contractor ID' })
  @IsString()
  contractorId: string;

  @ApiProperty({ description: 'Project ID', required: false })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({ description: 'Producer name' })
  @IsString()
  producer: string;

  @ApiProperty({ description: 'Insured name' })
  @IsString()
  insured: string;

  @ApiProperty({ description: 'Insured address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Coverage details' })
  @IsObject()
  coverages: any;

  @ApiProperty({ description: 'Effective date' })
  @IsDateString()
  effectiveDate: string;

  @ApiProperty({ description: 'Expiration date' })
  @IsDateString()
  expirationDate: string;

  @ApiProperty({ description: 'Certificate holder name' })
  @IsString()
  certificateHolder: string;

  @ApiProperty({ description: 'Description of operations', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
