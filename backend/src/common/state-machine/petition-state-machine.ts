import { PetitionState } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

// The single source of truth for "what state can become what state".
// Every state transition in the app must go through this map — nothing
// mutates Petition.state directly. That's what makes it a state machine
// instead of just a string field anyone can overwrite.
const ALLOWED_TRANSITIONS: Record<PetitionState, PetitionState[]> = {
  DRAFT: [PetitionState.SUBMITTED],
  SUBMITTED: [PetitionState.UNDER_REVIEW, PetitionState.EXPIRED],
  UNDER_REVIEW: [
    PetitionState.PENDING_APPROVAL,
    PetitionState.REJECTED,
    PetitionState.EXPIRED,
  ],
  PENDING_APPROVAL: [
    PetitionState.APPROVED,
    PetitionState.REJECTED,
    PetitionState.EXPIRED,
  ],
  APPROVED: [],
  REJECTED: [],
  EXPIRED: [],
};

export function canTransition(
  from: PetitionState,
  to: PetitionState,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// Throws instead of returning a boolean when the caller wants the request
// to fail loudly (e.g. an HTTP endpoint) rather than silently no-op.
export function assertTransition(from: PetitionState, to: PetitionState) {
  if (!canTransition(from, to)) {
    throw new BadRequestException(
      `Cannot move petition from ${from} to ${to}`,
    );
  }
}

// A petition that already ended (APPROVED, REJECTED, EXPIRED) has no
// outgoing transitions left. Used by services to short-circuit before even
// looking up rules, e.g. to refuse a new Approval on an EXPIRED petition.
export function isFinalState(state: PetitionState): boolean {
  return ALLOWED_TRANSITIONS[state].length === 0;
}
