import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BrokerPortalService } from './broker-portal.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('broker-portal')
@Controller('broker-portal')
export class BrokerPortalController {
  constructor(private readonly brokerPortalService: BrokerPortalService) {}

  @Post('access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createAccess(@Body() body: { email: string; companyName: string; permissions?: any }) {
    return this.brokerPortalService.createAccess(body.email, body.companyName, body.permissions);
  }

  @Get('validate')
  async validateAccess(@Query('code') accessCode: string) {
    return this.brokerPortalService.validateAccessCode(accessCode);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAllBrokerAccess() {
    return this.brokerPortalService.getAllBrokerAccess();
  }

  @Get(':email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getBrokerAccess(@Param('email') email: string) {
    return this.brokerPortalService.getBrokerAccess(email);
  }

  @Put(':email/permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updatePermissions(@Param('email') email: string, @Body('permissions') permissions: any) {
    return this.brokerPortalService.updatePermissions(email, permissions);
  }

  @Patch(':email/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async disableAccess(@Param('email') email: string) {
    return this.brokerPortalService.disableAccess(email);
  }

  @Patch(':email/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async enableAccess(@Param('email') email: string) {
    return this.brokerPortalService.enableAccess(email);
  }

  @Post(':email/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async regenerateAccessCode(@Param('email') email: string) {
    return this.brokerPortalService.regenerateAccessCode(email);
  }

  @Delete(':email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteAccess(@Param('email') email: string) {
    return this.brokerPortalService.deleteAccess(email);
  }
}
