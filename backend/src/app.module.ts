import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { WorkflowModule } from './workflow/workflow.module';
import { QueueModule } from './queue/queue.module';
import { PetitionsModule } from './petitions/petitions.module';
import { PetitionersModule } from './petitioners/petitioners.module';
import { ApproversModule } from './approvers/approvers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    WorkflowModule,
    QueueModule,
    PetitionsModule,
    PetitionersModule,
    ApproversModule,
  ],
})
export class AppModule {}
