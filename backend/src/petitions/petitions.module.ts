import { Module } from '@nestjs/common';
import { PetitionsService } from './petitions.service';
import { PetitionsController } from './petitions.controller';
import { WorkflowModule } from '../workflow/workflow.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [WorkflowModule, QueueModule],
  controllers: [PetitionsController],
  providers: [PetitionsService],
  exports: [PetitionsService],
})
export class PetitionsModule {}
