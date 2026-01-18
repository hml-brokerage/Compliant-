import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { HoldHarmlessService } from './hold-harmless.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, HoldHarmlessStatus } from '@prisma/client';

@ApiTags('hold-harmless')
@Controller('hold-harmless')
export class HoldHarmlessController {
  constructor(private readonly holdHarmlessService: HoldHarmlessService) {}

  @Post('auto-generate/:coiId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auto-generate hold harmless when COI is approved (internal use)' })
  @ApiResponse({ status: 201, description: 'Hold harmless generated and sent to subcontractor' })
  async autoGenerate(@Param('coiId') coiId: string) {
    return this.holdHarmlessService.autoGenerateOnCOIApproval(coiId);
  }

  @Get('by-token/:token')
  @ApiOperation({ summary: 'Get hold harmless by signature token (public endpoint for signature page)' })
  @ApiResponse({ status: 200, description: 'Returns hold harmless details for signing' })
  async getByToken(@Param('token') token: string) {
    return this.holdHarmlessService.getByToken(token);
  }

  @Post('sign/subcontractor/:token')
  @ApiOperation({ summary: 'Process subcontractor signature (public endpoint)' })
  @ApiResponse({ status: 200, description: 'Subcontractor signature recorded, GC link sent' })
  async signSubcontractor(
    @Param('token') token: string,
    @Body() signatureData: { signatureUrl: string; signedBy: string }
  ) {
    return this.holdHarmlessService.processSubcontractorSignature(token, signatureData);
  }

  @Post('sign/gc/:token')
  @ApiOperation({ summary: 'Process GC signature (public endpoint)' })
  @ApiResponse({ status: 200, description: 'GC signature recorded, hold harmless completed' })
  async signGC(
    @Param('token') token: string,
    @Body() signatureData: { signatureUrl: string; signedBy: string; finalDocUrl: string }
  ) {
    return this.holdHarmlessService.processGCSignature(token, signatureData);
  }

  @Get('coi/:coiId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get hold harmless agreement for a COI' })
  @ApiResponse({ status: 200, description: 'Returns hold harmless agreement' })
  async getHoldHarmless(@Param('coiId') coiId: string) {
    return this.holdHarmlessService.getHoldHarmless(coiId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all hold harmless agreements' })
  @ApiQuery({ name: 'status', enum: HoldHarmlessStatus, required: false })
  @ApiQuery({ name: 'pendingSignature', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'Returns list of hold harmless agreements' })
  async getAllHoldHarmless(
    @Query('status') status?: HoldHarmlessStatus,
    @Query('pendingSignature') pendingSignature?: boolean,
  ) {
    return this.holdHarmlessService.getAllHoldHarmless({
      status,
      pendingSignature: pendingSignature === true,
    });
  }

  @Post(':id/resend/:party')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend signature link to SUB or GC' })
  @ApiResponse({ status: 200, description: 'Signature link resent' })
  async resendSignatureLink(
    @Param('id') id: string,
    @Param('party') party: 'SUB' | 'GC',
  ) {
    return this.holdHarmlessService.resendSignatureLink(id, party);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get hold harmless statistics' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  async getStatistics() {
    return this.holdHarmlessService.getStatistics();
  }
}
