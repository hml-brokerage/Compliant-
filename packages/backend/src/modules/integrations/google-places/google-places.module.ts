import { Module } from '@nestjs/common';
import { GooglePlacesService } from './google-places.service';
import { GooglePlacesController } from './google-places.controller';
import { PrismaService } from '../../../config/prisma.service';

@Module({
  controllers: [GooglePlacesController],
  providers: [GooglePlacesService, PrismaService],
  exports: [GooglePlacesService],
})
export class GooglePlacesModule {}
