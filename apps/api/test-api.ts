import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ListingService } from './src/listing/listing.service';
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const listingService = app.get(ListingService);

  const profile = await prisma.agencyProfile.findFirst();
  if (profile) {
    const listings = await listingService.findByAgency(profile.userId);
    console.log(JSON.stringify(listings, null, 2));
  } else {
    console.log("No profile found");
  }
  
  await app.close();
}
main();
