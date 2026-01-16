import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateAddressDto {
  @ApiProperty({ description: 'Business address' })
  @IsString()
  address: string;
}

export class PlaceDetailsDto {
  @ApiProperty({ description: 'Google Place ID' })
  @IsString()
  placeId: string;
}
