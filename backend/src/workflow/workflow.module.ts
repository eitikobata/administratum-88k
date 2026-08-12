import { Module } from '@nestjs/common';
import { PetitionWorkflowService } from './petition-workflow.service';

@Module({
  providers: [PetitionWorkflowService],
  exports: [PetitionWorkflowService],
})
export class WorkflowModule {}
