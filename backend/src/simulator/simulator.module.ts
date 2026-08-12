import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PetitionsModule } from '../petitions/petitions.module';
import {
  SIMULATOR_CLEANUP_QUEUE,
  SIMULATOR_TICK_QUEUE,
} from './simulator.constants';
import { SimulatorProducer } from './simulator.producer';
import { SimulatorTickProcessor } from './processors/simulator-tick.processor';
import { SimulatorCleanupProcessor } from './processors/simulator-cleanup.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: SIMULATOR_TICK_QUEUE },
      { name: SIMULATOR_CLEANUP_QUEUE },
    ),
    // Reuses PetitionsService (create/submit/decide) instead of
    // reimplementing petition creation here — the simulator should exercise
    // the exact same code path a real visitor's click does, not a
    // parallel shortcut that could quietly drift from it.
    PetitionsModule,
  ],
  providers: [SimulatorProducer, SimulatorTickProcessor, SimulatorCleanupProcessor],
})
export class SimulatorModule {}
