import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Thin wrapper so the rest of the app can inject PrismaService like any
// other Nest provider, instead of importing a raw PrismaClient instance
// everywhere. Connecting/disconnecting on module lifecycle hooks keeps the
// connection pool tied to the app's own lifecycle.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
