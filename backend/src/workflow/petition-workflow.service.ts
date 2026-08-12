import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApprovalDecision, Petition, PetitionState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertTransition } from '../common/state-machine/petition-state-machine';
import { PETITION_UPDATED_EVENT } from '../realtime/realtime.constants';

@Injectable()
export class PetitionWorkflowService {
  private readonly logger = new Logger(PetitionWorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async findOrThrow(petitionId: string): Promise<Petition> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });
    if (!petition) {
      throw new NotFoundException(`Petition ${petitionId} not found`);
    }
    return petition;
  }

  // The only method in the whole app that's allowed to change
  // Petition.state. Every other service/processor calls this instead of
  // touching prisma.petition.update directly, so every state change is
  // guaranteed to (a) pass through the state machine rules and (b) leave an
  // audit trail in StateHistory. Wrapped in a transaction so a crash
  // between the two writes can never leave state and history disagreeing.
  async transitionTo(
    petitionId: string,
    toState: PetitionState,
    reason?: string,
  ): Promise<Petition> {
    const petition = await this.findOrThrow(petitionId);
    assertTransition(petition.state, toState);

    const [updated] = await this.prisma.$transaction([
      this.prisma.petition.update({
        where: { id: petitionId },
        data: { state: toState },
      }),
      this.prisma.stateHistory.create({
        data: {
          petitionId,
          fromState: petition.state,
          toState,
          reason,
        },
      }),
    ]);

    this.logger.log(
      `Petition ${petitionId}: ${petition.state} -> ${toState}${reason ? ` (${reason})` : ''}`,
    );

    // The workflow service doesn't know or care whether anyone is
    // listening. Whatever needs to react to a state change (right now:
    // the WebSocket gateway; later: maybe an audit log or a notifier)
    // subscribes to this event on its own, without this file ever
    // importing it. Same decoupling pattern used in Nexus Dispatch.
    this.eventEmitter.emit(PETITION_UPDATED_EVENT, {
      petitionId,
      fromState: petition.state,
      toState,
      reason,
    });

    return updated;
  }

  // Called by the review worker. Simulates the kind of automated checks a
  // real system would run (schema validation, budget checks, sanctions
  // lists, whatever) — here it's a placeholder rule so the pipeline has
  // something real to branch on.
  async runAutomatedReview(petitionId: string): Promise<void> {
    const petition = await this.findOrThrow(petitionId);

    // Idempotency guard: if this job is a BullMQ retry firing after a
    // previous attempt already moved the petition forward, do nothing
    // instead of throwing on an now-invalid transition.
    if (petition.state !== PetitionState.SUBMITTED) {
      this.logger.warn(
        `Skipping review for ${petitionId}: state is ${petition.state}, expected SUBMITTED`,
      );
      return;
    }

    await this.transitionTo(
      petitionId,
      PetitionState.UNDER_REVIEW,
      'Automated review started',
    );

    const payload = (petition.payload ?? {}) as unknown as Record<
      string,
      unknown
    >;
    const failsAutomaticCheck = payload.forceReject === true;

    if (failsAutomaticCheck) {
      await this.transitionTo(
        petitionId,
        PetitionState.REJECTED,
        'Automated review found a disqualifying condition',
      );
      return;
    }

    await this.transitionTo(
      petitionId,
      PetitionState.PENDING_APPROVAL,
      'Automated review passed, awaiting human approval',
    );
  }

  // Called from the approvals endpoint. Records one approver's decision and
  // then figures out whether that decision closes the petition out.
  async recordApproval(
    petitionId: string,
    approverId: string,
    decision: ApprovalDecision,
    comment?: string,
  ) {
    const petition = await this.findOrThrow(petitionId);

    if (petition.state !== PetitionState.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Petition ${petitionId} is not awaiting approval (current state: ${petition.state})`,
      );
    }

    try {
      await this.prisma.approval.create({
        data: { petitionId, approverId, decision, comment },
      });
    } catch (err: any) {
      // Unique constraint on [petitionId, approverId] — same approver
      // can't vote twice on the same petition.
      if (err?.code === 'P2002') {
        throw new ConflictException(
          'This approver has already decided on this petition',
        );
      }
      throw err;
    }

    // Early exit: a single rejection ends the petition immediately, no
    // need to wait for the second approver on a HIGH impact petition.
    if (decision === ApprovalDecision.REJECTED) {
      return this.transitionTo(
        petitionId,
        PetitionState.REJECTED,
        `Rejected by approver ${approverId}`,
      );
    }

    const approvedCount = await this.prisma.approval.count({
      where: { petitionId, decision: ApprovalDecision.APPROVED },
    });

    if (approvedCount >= petition.requiredApprovals) {
      return this.transitionTo(
        petitionId,
        PetitionState.APPROVED,
        `Reached ${approvedCount}/${petition.requiredApprovals} required approvals`,
      );
    }

    // Not enough approvals yet — stays in PENDING_APPROVAL, just record
    // the vote and let the caller know it's still waiting.
    return this.findOrThrow(petitionId);
  }

  // Called on every expiry-sweep tick. Finds every petition still "in
  // flight" whose deadline has passed and closes it out as EXPIRED. Runs
  // as a single query + loop rather than one job per petition, since the
  // sweep itself is already the periodic unit of work.
  async sweepExpiredPetitions(): Promise<number> {
    const overdue = await this.prisma.petition.findMany({
      where: {
        deadlineAt: { lt: new Date() },
        state: {
          in: [
            PetitionState.SUBMITTED,
            PetitionState.UNDER_REVIEW,
            PetitionState.PENDING_APPROVAL,
          ],
        },
      },
      select: { id: true },
    });

    for (const { id } of overdue) {
      await this.transitionTo(
        id,
        PetitionState.EXPIRED,
        'Deadline passed with no final decision',
      );
    }

    if (overdue.length > 0) {
      this.logger.log(`Expiry sweep closed ${overdue.length} petition(s)`);
    }

    return overdue.length;
  }
}
