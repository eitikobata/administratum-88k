import { Module } from '@nestjs/common';
import { ApproversService } from './approvers.service';
import { ApproversController } from './approvers.controller';

@Module({
  controllers: [ApproversController],
  providers: [ApproversService],
  exports: [ApproversService],
})
export class ApproversModule {}
