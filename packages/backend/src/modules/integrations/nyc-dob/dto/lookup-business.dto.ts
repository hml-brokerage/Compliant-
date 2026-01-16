import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LookupBusinessDto {
  @ApiProperty({ description: 'License number' })
  @IsString()
  licenseNumber: string;
}
