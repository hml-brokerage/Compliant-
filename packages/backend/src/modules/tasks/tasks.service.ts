import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuthService } from '../auth/auth.service';

/**
 * Service for scheduled tasks and background jobs
 * Handles automated maintenance tasks like token cleanup
 */
@Injectable()
export class TasksService {
  constructor(
    private authService: AuthService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Clean up expired refresh tokens daily at 2 AM
   * Runs automatically via cron scheduler
   * Processes in batches to prevent database overload
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleTokenCleanup() {
    this.logger.log({
      message: 'Starting automated refresh token cleanup',
      context: 'TasksService',
    });

    try {
      let totalDeleted = 0;
      let batchDeleted = 0;
      const batchSize = 1000;

      // Process in batches until no more expired tokens
      do {
        batchDeleted = await this.authService.cleanupExpiredTokens(batchSize);
        totalDeleted += batchDeleted;

        if (batchDeleted === batchSize) {
          // More tokens to process, wait a bit before next batch
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } while (batchDeleted === batchSize);

      this.logger.log({
        message: 'Completed automated refresh token cleanup',
        context: 'TasksService',
        totalDeleted,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({
        message: 'Failed to cleanup expired tokens',
        context: 'TasksService',
        error: errorMessage,
      });
    }
  }
}
