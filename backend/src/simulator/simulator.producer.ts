import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  SIMULATOR_CLEANUP_JOB,
  SIMULATOR_CLEANUP_QUEUE,
  SIMULATOR_CLEANUP_REPEAT_JOB_ID,
  SIMULATOR_TICK_JOB,
  SIMULATOR_TICK_QUEUE,
  SIMULATOR_TICK_REPEAT_JOB_ID,
} from './simulator.constants';

@Injectable()
export class SimulatorProducer implements OnModuleInit {
  private readonly logger = new Logger(SimulatorProducer.name);

  constructor(
    @InjectQueue(SIMULATOR_TICK_QUEUE) private readonly tickQueue: Queue,
    @InjectQueue(SIMULATOR_CLEANUP_QUEUE) private readonly cleanupQueue: Queue,
  ) {}

  async onModuleInit() {
    // Off by default in a plain local checkout unless explicitly enabled —
    // nobody wants synthetic petitions cluttering their own dev database
    // while they're testing something unrelated. Production sets this to
    // 'true' so the public demo stays visibly alive.
    const enabled = process.env.SIMULATOR_ENABLED === 'true';
    if (!enabled) {
      this.logger.log('Simulator disabled (SIMULATOR_ENABLED is not "true")');
      return;
    }

    // Deliberately long by default — this isn't trying to look like a busy
    // real-time system, just to prove the demo is alive without drowning
    // real visitor activity in synthetic noise.
    const tickIntervalMs = Number(
      process.env.SIMULATOR_TICK_INTERVAL_MS ?? 15 * 60 * 1000,
    );
    const cleanupIntervalMs = Number(
      process.env.SIMULATOR_CLEANUP_INTERVAL_MS ?? 24 * 60 * 60 * 1000,
    );

    await this.tickQueue.upsertJobScheduler(
      SIMULATOR_TICK_REPEAT_JOB_ID,
      { every: tickIntervalMs },
      { name: SIMULATOR_TICK_JOB, data: {} },
    );
    await this.cleanupQueue.upsertJobScheduler(
      SIMULATOR_CLEANUP_REPEAT_JOB_ID,
      { every: cleanupIntervalMs },
      { name: SIMULATOR_CLEANUP_JOB, data: {} },
    );

    this.logger.log(
      `Simulator enabled: tick every ${tickIntervalMs}ms, cleanup every ${cleanupIntervalMs}ms`,
    );
  }
}
