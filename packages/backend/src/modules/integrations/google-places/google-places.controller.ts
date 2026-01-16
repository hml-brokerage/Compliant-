import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GooglePlacesService } from './google-places.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ValidateAddressDto, PlaceDetailsDto } from './dto/place.dto';

@ApiTags('integrations-google-places')
@Controller('integrations/google-places')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GooglePlacesController {
  constructor(private readonly googlePlacesService: GooglePlacesService) {}

  @Post('find')
  async findPlace(@Body() dto: ValidateAddressDto) {
    return this.googlePlacesService.findPlaceByAddress(dto.address);
  }

  @Post('details')
  async getDetails(@Body() dto: PlaceDetailsDto, @Body('contractorId') contractorId: string) {
    return this.googlePlacesService.getPlaceDetails(dto.placeId, contractorId);
  }

  @Get('verifications')
  async getVerifications(@Query('contractorId') contractorId: string) {
    return this.googlePlacesService.getVerifications(contractorId);
  }
}
