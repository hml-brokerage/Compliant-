import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GCPortalService } from './gc-portal.service';

@ApiTags('gc-portal')
@Controller('gc-portal')
export class GCPortalController {
  constructor(private readonly gcPortalService: GCPortalService) {}

  @Post('access')
  async createAccess(@Body('contractorId') contractorId: string) {
    return this.gcPortalService.createAccess(contractorId);
  }

  @Get('validate')
  async validateAccess(@Query('code') accessCode: string) {
    return this.gcPortalService.validateAccessCode(accessCode);
  }

  @Get('contractor')
  async getContractorInfo(@Query('code') accessCode: string) {
    return this.gcPortalService.getContractorInfo(accessCode);
  }

  @Patch(':contractorId/disable')
  async disableAccess(@Param('contractorId') contractorId: string) {
    return this.gcPortalService.disableAccess(contractorId);
  }

  @Patch(':contractorId/enable')
  async enableAccess(@Param('contractorId') contractorId: string) {
    return this.gcPortalService.enableAccess(contractorId);
  }

  @Post(':contractorId/regenerate')
  async regenerateAccessCode(@Param('contractorId') contractorId: string) {
    return this.gcPortalService.regenerateAccessCode(contractorId);
  }
}
