import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PetitionWorkflowService } from '../../workflow/petition-workflow.service';
import { PETITION_REVIEW_QUEUE } from '../queue.constants';

// A Worker: this is the process that actually pulls jobs off the
// 'petition-review' queue and does the work, one job at a time. If it
// throws, BullMQ marks the job failed and retries it according to the
// options set when it was enqueued (see PetitionQueueProducer).
@Processor(PETITION_REVIEW_QUEUE)
export class PetitionReviewProcessor extends WorkerHost {
  private readonly logger = new Logger(PetitionReviewProcessor.name);

  constructor(private readonly workflowService: PetitionWorkflowService) {
    super();
  }

  async process(job: Job<{ petitionId: string }>): Promise<void> {
    const { petitionId } = job.data;
    this.logger.log(`Reviewing petition ${petitionId} (job ${job.id})`);
    await this.workflowService.runAutomatedReview(petitionId);
  }
}
