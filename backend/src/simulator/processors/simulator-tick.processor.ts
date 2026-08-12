import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ApprovalDecision, PetitionState } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PetitionsService } from '../../petitions/petitions.service';
import { SIMULATOR_TICK_QUEUE } from '../simulator.constants';
import {
  ensureSimulatedActors,
  listSimulatedApprovers,
  pickPetitionTemplate,
  pickRandom,
  pickSimulatedPetitioner,
} from '../simulated-actors';

// Most decisions lean APPROVED — a demo where everything gets rejected
// isn't an interesting one to watch move through the pipeline.
const APPROVAL_WEIGHT = 0.85;

@Processor(SIMULATOR_TICK_QUEUE)
export class SimulatorTickProcessor extends WorkerHost {
  private readonly logger = new Logger(SimulatorTickProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly petitionsService: PetitionsService,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    await ensureSimulatedActors(this.prisma);

    await this.decidePendingSimulatedPetitions();
    await this.generateOnePetition();
  }

  // Any simulated petition still waiting on a human vote would sit there
  // forever, since real approvers have no reason to act on synthetic
  // work. The simulator plays that role for its own petitions only —
  // real, visitor-filed petitions are never auto-decided.
  private async decidePendingSimulatedPetitions() {
    const approvers = await listSimulatedApprovers(this.prisma);
    if (approvers.length === 0) return;

    const pending = await this.prisma.petition.findMany({
      where: { simulated: true, state: PetitionState.PENDING_APPROVAL },
      include: { approvals: true },
    });

    for (const petition of pending) {
      const alreadyVoted = new Set(petition.approvals.map((a) => a.approverId));
      const available = approvers.filter((a) => !alreadyVoted.has(a.id));
      if (available.length === 0) continue;

      const approver = pickRandom(available);
      const decision: ApprovalDecision =
        Math.random() < APPROVAL_WEIGHT
          ? ApprovalDecision.APPROVED
          : ApprovalDecision.REJECTED;

      try {
        await this.petitionsService.decide(petition.id, {
          approverId: approver.id,
          decision,
        });
      } catch (err) {
        // Another tick or a real visitor may have already decided this
        // one between the query above and this call — not worth failing
        // the whole tick over a race that resolves itself.
        this.logger.warn(
          `Skipped auto-decision on ${petition.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  private async generateOnePetition() {
    const petitioner = await pickSimulatedPetitioner(this.prisma);
    if (!petitioner) return;

    const template = pickPetitionTemplate();

    const petition = await this.petitionsService.create(
      {
        petitionerId: petitioner.id,
        type: template.type,
        impact: template.impact,
        payload: { notes: template.notes },
      },
      true,
    );

    await this.petitionsService.submit(petition.id);
    this.logger.log(
      `Simulated petition ${petition.id.slice(0, 8)} (${template.type}) filed and submitted`,
    );
  }
}
