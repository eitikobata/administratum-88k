import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PetitionImpact, PetitionState, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PetitionWorkflowService } from '../workflow/petition-workflow.service';
import { PetitionQueueProducer } from '../queue/producers/petition-queue.producer';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { DecideApprovalDto } from './dto/decide-approval.dto';

// LOW impact needs one approver to sign off; HIGH impact needs two. This
// is the only place that decision is made, so changing the policy later
// means changing one line, not hunting through the codebase.
const REQUIRED_APPROVALS: Record<PetitionImpact, number> = {
  [PetitionImpact.LOW]: 1,
  [PetitionImpact.HIGH]: 2,
};

const INCLUDE_DETAILS = {
  petitioner: true,
  approvals: { include: { approver: true } },
  history: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class PetitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowService: PetitionWorkflowService,
    private readonly queueProducer: PetitionQueueProducer,
  ) {}

  async create(dto: CreatePetitionDto, simulated = false) {
    return this.prisma.petition.create({
      data: {
        type: dto.type,
        impact: dto.impact,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
        petitionerId: dto.petitionerId,
        requiredApprovals: REQUIRED_APPROVALS[dto.impact],
        simulated,
      },
    });
  }

  // Moves a DRAFT petition into the workflow: sets its deadline, flips it
  // to SUBMITTED, and hands it off to the review queue. This is the moment
  // a petition stops being "just a database row" and becomes a job the
  // system will actively work on.
  async submit(petitionId: string) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });
    if (!petition) {
      throw new NotFoundException(`Petition ${petitionId} not found`);
    }
    if (petition.state !== PetitionState.DRAFT) {
      throw new BadRequestException(
        `Only DRAFT petitions can be submitted (current state: ${petition.state})`,
      );
    }

    const deadlineHours = Number(process.env.PETITION_DEADLINE_HOURS ?? 72);
    const deadlineAt = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

    await this.prisma.petition.update({
      where: { id: petitionId },
      data: { deadlineAt },
    });

    const updated = await this.workflowService.transitionTo(
      petitionId,
      PetitionState.SUBMITTED,
      'Submitted by petitioner',
    );

    await this.queueProducer.enqueueReview(petitionId);

    return updated;
  }

  async decide(petitionId: string, dto: DecideApprovalDto) {
    return this.workflowService.recordApproval(
      petitionId,
      dto.approverId,
      dto.decision,
      dto.comment,
    );
  }

  async findOne(petitionId: string) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      include: INCLUDE_DETAILS,
    });
    if (!petition) {
      throw new NotFoundException(`Petition ${petitionId} not found`);
    }
    return petition;
  }

  async findAll(state?: PetitionState) {
    return this.prisma.petition.findMany({
      where: state ? { state } : undefined,
      include: INCLUDE_DETAILS,
      orderBy: { createdAt: 'desc' },
    });
  }
}
