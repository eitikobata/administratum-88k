import type { PetitionState } from '@/lib/types';

// Color encodes meaning, not decoration: green states are still "alive" in
// the workflow, amber means waiting on a human, red means it's over and it
// didn't go the petitioner's way. This mapping is the single place that
// decides that, so it can't drift between screens.
const STYLES: Record<PetitionState, string> = {
  DRAFT: 'text-term-greenDim border-term-greenDim',
  SUBMITTED: 'text-term-green border-term-green',
  UNDER_REVIEW: 'text-term-green border-term-green',
  PENDING_APPROVAL: 'text-term-amber border-term-amber',
  APPROVED: 'text-term-green border-term-green',
  REJECTED: 'text-term-red border-term-red',
  EXPIRED: 'text-term-red border-term-red',
};

export function StatusBadge({ state }: { state: PetitionState }) {
  return (
    <span
      className={`border px-2 py-0.5 text-xs tracking-wider ${STYLES[state]}`}
    >
      {state.replace('_', ' ')}
    </span>
  );
}
