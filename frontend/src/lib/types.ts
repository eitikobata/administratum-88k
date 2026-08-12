export type PetitionState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export type PetitionImpact = 'LOW' | 'HIGH';

export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export interface Petitioner {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Approver {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  decision: ApprovalDecision;
  comment: string | null;
  approverId: string;
  decidedAt: string;
  approver: Approver;
}

export interface StateHistoryEntry {
  id: string;
  fromState: PetitionState | null;
  toState: PetitionState;
  reason: string | null;
  createdAt: string;
}

export interface Petition {
  id: string;
  type: string;
  impact: PetitionImpact;
  state: PetitionState;
  payload: Record<string, unknown> | null;
  requiredApprovals: number;
  deadlineAt: string | null;
  petitionerId: string;
  createdAt: string;
  updatedAt: string;
  petitioner?: Petitioner;
  approvals?: Approval[];
  history?: StateHistoryEntry[];
}

// Emitted by the backend's WebSocket gateway (realtime/petitions.gateway.ts)
// on every state transition.
export interface PetitionUpdatedEvent {
  petitionId: string;
  fromState: PetitionState | null;
  toState: PetitionState;
  reason?: string;
}
