import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PetitionWorkflowService } from '../../workflow/petition-workflow.service';
import { PETITION_EXPIRY_QUEUE } from '../queue.constants';

// This is the "long-running background check" piece: it doesn't run once
// per petition, it runs on a fixed schedule (see
// PetitionQueueProducer.onModuleInit) and sweeps every petition that
// missed its deadline in one pass.
@Processor(PETITION_EXPIRY_QUEUE)
export class PetitionExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(PetitionExpiryProcessor.name);

  constructor(private readonly workflowService: PetitionWorkflowService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(`Running expiry sweep (job ${job.id})`);
    await this.workflowService.sweepExpiredPetitions();
  }
}
