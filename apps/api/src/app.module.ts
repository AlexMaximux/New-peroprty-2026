import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { AgencyModule } from './agency/agency.module';
import { AdminModule } from './admin/admin.module';
import { ListingModule } from './listing/listing.module';
import { FavouritesModule } from './favourites/favourites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StorageModule,
    AgencyModule,
    AdminModule,
    ListingModule,
    FavouritesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}