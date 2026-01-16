import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../config/prisma.service';
import axios from 'axios';

@Injectable()
export class NYCDOBService {
  private readonly logger = new Logger(NYCDOBService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.apiUrl = this.configService.get<string>('NYC_DOB_API_URL') || 'https://data.cityofnewyork.us/resource/';
    this.apiKey = this.configService.get<string>('NYC_DOB_API_KEY') || '';
  }

  async lookupBusiness(licenseNumber: string, contractorId: string): Promise<any> {
    try {
      // Call NYC DOB Open Data API
      const response = await axios.get(`${this.apiUrl}w7w3-xahh.json`, {
        params: {
          license_nbr: licenseNumber,
          '$$app_token': this.apiKey,
        },
      });

      if (response.data && response.data.length > 0) {
        const data = response.data[0];

        // Store in database
        const record = await this.prisma.dOBRecord.create({
          data: {
            contractorId,
            licenseNumber,
            businessName: data.business_name || '',
            licenseType: data.license_type || '',
            licenseStatus: data.license_status || '',
            expirationDate: data.expiration_date ? new Date(data.expiration_date) : null,
            violations: data.violations || null,
            complaints: data.complaints || null,
          },
        });

        this.logger.log(`DOB record created for license ${licenseNumber}`);
        return record;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to lookup DOB business: ${error.message}`);
      throw error;
    }
  }

  async getRecords(contractorId: string): Promise<any[]> {
    return this.prisma.dOBRecord.findMany({
      where: { contractorId },
      orderBy: { lastVerified: 'desc' },
    });
  }
}
