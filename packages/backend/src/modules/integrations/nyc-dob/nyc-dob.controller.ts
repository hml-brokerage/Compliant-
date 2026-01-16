import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NYCDOBService } from './nyc-dob.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LookupBusinessDto } from './dto/lookup-business.dto';

@ApiTags('integrations-nyc-dob')
@Controller('integrations/nyc-dob')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NYCDOBController {
  constructor(private readonly nycDobService: NYCDOBService) {}

  @Post('lookup')
  async lookupBusiness(@Body() dto: LookupBusinessDto, @Body('contractorId') contractorId: string) {
    return this.nycDobService.lookupBusiness(dto.licenseNumber, contractorId);
  }

  @Get('records')
  async getRecords(@Query('contractorId') contractorId: string) {
    return this.nycDobService.getRecords(contractorId);
  }
}
