import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PetitionState } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SIMULATOR_CLEANUP_QUEUE } from '../simulator.constants';

const CLOSED_STATES = [
  PetitionState.APPROVED,
  PetitionState.REJECTED,
  PetitionState.EXPIRED,
];

@Processor(SIMULATOR_CLEANUP_QUEUE)
export class SimulatorCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(SimulatorCleanupProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const maxAgeDays = Number(process.env.SIMULATOR_CLEANUP_MAX_AGE_DAYS ?? 3);
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

    // simulated: true is the whole safeguard here — a real, visitor-filed
    // petition is never eligible for this delete, no matter how old or
    // how long closed it's been. Approvals and StateHistory rows cascade
    // automatically (see schema.prisma onDelete: Cascade), so this one
    // query is enough to clean up everything that belonged to the row.
    const result = await this.prisma.petition.deleteMany({
      where: {
        simulated: true,
        state: { in: CLOSED_STATES },
        updatedAt: { lt: cutoff },
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `Cleanup removed ${result.count} simulated petition(s) closed for over ${maxAgeDays} day(s)`,
      );
    }
  }
}
