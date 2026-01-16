import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // Settings endpoints
  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Get('settings/:key')
  async getSetting(@Param('key') key: string) {
    return this.adminService.getSetting(key);
  }

  @Put('settings/:key')
  async updateSetting(
    @Param('key') key: string,
    @Body() body: { value: string; description?: string },
    @Request() req,
  ) {
    await this.auditLogService.log(
      'UPDATE_SETTING',
      'AdminSettings',
      key,
      req.user.userId,
      body,
      req.ip,
      req.headers['user-agent'],
    );

    return this.adminService.updateSetting(key, body.value, req.user.userId, body.description);
  }

  @Delete('settings/:key')
  async deleteSetting(@Param('key') key: string, @Request() req) {
    await this.auditLogService.log(
      'DELETE_SETTING',
      'AdminSettings',
      key,
      req.user.userId,
      null,
      req.ip,
      req.headers['user-agent'],
    );

    return this.adminService.deleteSetting(key);
  }

  // Dashboard endpoints
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/health')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  // Audit logs endpoints
  @Get('audit-logs')
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogService.getLogs({
      userId,
      entity,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('audit-logs/:id')
  async getAuditLog(@Param('id') id: string) {
    return this.auditLogService.getLogById(id);
  }

  @Post('audit-logs/cleanup')
  async cleanupAuditLogs(@Body('retentionDays') retentionDays?: number) {
    const count = await this.auditLogService.cleanupOldLogs(retentionDays);
    return { message: `Cleaned up ${count} old audit logs` };
  }
}
