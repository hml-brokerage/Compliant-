import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../config/prisma.service';
import axios from 'axios';

@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY') || '';
  }

  async findPlaceByAddress(address: string): Promise<any> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
        params: {
          input: address,
          inputtype: 'textquery',
          fields: 'place_id,name,formatted_address',
          key: this.apiKey,
        },
      });

      return response.data.candidates?.[0] || null;
    } catch (error) {
      this.logger.error(`Failed to find place: ${error.message}`);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string, contractorId: string): Promise<any> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,formatted_phone_number,website,business_status,rating,user_ratings_total',
          key: this.apiKey,
        },
      });

      const place = response.data.result;

      if (place) {
        // Store verification in database
        const verification = await this.prisma.placeVerification.create({
          data: {
            contractorId,
            placeId,
            name: place.name,
            address: place.formatted_address,
            phone: place.formatted_phone_number,
            website: place.website,
            businessStatus: place.business_status,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            verified: place.business_status === 'OPERATIONAL',
          },
        });

        this.logger.log(`Place verification created for ${placeId}`);
        return verification;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get place details: ${error.message}`);
      throw error;
    }
  }

  async getVerifications(contractorId: string): Promise<any[]> {
    return this.prisma.placeVerification.findMany({
      where: { contractorId },
      orderBy: { verifiedAt: 'desc' },
    });
  }
}
