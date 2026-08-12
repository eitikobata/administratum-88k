import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WorkflowModule } from '../workflow/workflow.module';
import { PETITION_EXPIRY_QUEUE, PETITION_REVIEW_QUEUE } from './queue.constants';
import { PetitionQueueProducer } from './producers/petition-queue.producer';
import { PetitionReviewProcessor } from './processors/petition-review.processor';
import { PetitionExpiryProcessor } from './processors/petition-expiry.processor';

@Module({
  imports: [
    // One Redis connection, shared by every queue/worker registered below.
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: PETITION_REVIEW_QUEUE },
      { name: PETITION_EXPIRY_QUEUE },
    ),
    WorkflowModule,
  ],
  providers: [
    PetitionQueueProducer,
    PetitionReviewProcessor,
    PetitionExpiryProcessor,
  ],
  exports: [PetitionQueueProducer],
})
export class QueueModule {}
