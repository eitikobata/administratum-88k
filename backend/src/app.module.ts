import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { WorkflowModule } from './workflow/workflow.module';
import { QueueModule } from './queue/queue.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SimulatorModule } from './simulator/simulator.module';
import { PetitionsModule } from './petitions/petitions.module';
import { PetitionersModule } from './petitioners/petitioners.module';
import { ApproversModule } from './approvers/approvers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global so any module can inject EventEmitter2 without importing this
    // module explicitly — same rationale as PrismaModule being @Global().
    EventEmitterModule.forRoot(),
    PrismaModule,
    WorkflowModule,
    QueueModule,
    RealtimeModule,
    PetitionsModule,
    PetitionersModule,
    ApproversModule,
    SimulatorModule,
  ],
})
export class AppModule {}
