import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  PETITION_EXPIRY_JOB,
  PETITION_EXPIRY_QUEUE,
  PETITION_EXPIRY_REPEAT_JOB_ID,
  PETITION_REVIEW_JOB,
  PETITION_REVIEW_QUEUE,
} from '../queue.constants';

// The only place in the app allowed to talk to the BullMQ queues directly.
// Services never inject a Queue themselves — they call these methods, so
// job names/options stay consistent no matter who's enqueueing.
@Injectable()
export class PetitionQueueProducer implements OnModuleInit {
  private readonly logger = new Logger(PetitionQueueProducer.name);

  constructor(
    @InjectQueue(PETITION_REVIEW_QUEUE) private readonly reviewQueue: Queue,
    @InjectQueue(PETITION_EXPIRY_QUEUE) private readonly expiryQueue: Queue,
  ) {}

  // Registers the recurring "check for expired petitions" job once, when
  // the app boots. Using a fixed jobId means calling this again on every
  // restart just re-confirms the same schedule instead of piling up
  // duplicate repeatable jobs — a classic BullMQ footgun.
  async onModuleInit() {
    const intervalMs = Number(process.env.EXPIRY_SWEEP_INTERVAL_MS ?? 30_000);

    await this.expiryQueue.upsertJobScheduler(
      PETITION_EXPIRY_REPEAT_JOB_ID,
      { every: intervalMs },
      { name: PETITION_EXPIRY_JOB, data: {} },
    );

    this.logger.log(
      `Expiry sweep scheduled every ${intervalMs}ms (job scheduler '${PETITION_EXPIRY_REPEAT_JOB_ID}')`,
    );
  }

  // Queues a petition for automated review right after it's submitted.
  // Retries a few times with backoff in case the worker or Postgres hiccups
  // — the whole point of using a queue instead of doing this inline.
  async enqueueReview(petitionId: string) {
    await this.reviewQueue.add(
      PETITION_REVIEW_JOB,
      { petitionId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
  }
}
