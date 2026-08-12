import { Module } from '@nestjs/common';
import { PetitionsGateway } from './petitions.gateway';

@Module({
  providers: [PetitionsGateway],
})
export class RealtimeModule {}
