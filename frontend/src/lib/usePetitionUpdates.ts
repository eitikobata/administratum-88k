'use client';

import { useEffect } from 'react';
import { getSocket } from './socket';
import type { PetitionUpdatedEvent } from './types';

// Deliberately dumb: it doesn't try to patch the exact petition that
// changed into local state (that gets fiddly with nested approvals/history
// fast). It just tells the caller "something changed, go re-fetch" — good
// enough at this scale, and much easier to reason about than partial
// client-side state merging.
export function usePetitionUpdates(onUpdate: (event: PetitionUpdatedEvent) => void) {
  useEffect(() => {
    const socket = getSocket();
    socket.on('petition.updated', onUpdate);
    return () => {
      socket.off('petition.updated', onUpdate);
    };
  }, [onUpdate]);
}
