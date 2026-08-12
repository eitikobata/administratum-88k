'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePetitionUpdates } from '@/lib/usePetitionUpdates';
import type { Petition, PetitionState } from '@/lib/types';
import { TerminalPanel } from '@/components/TerminalPanel';
import { StatusBadge } from '@/components/StatusBadge';
import { BootSequence } from '@/components/BootSequence';

const ALL_STATES: PetitionState[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
];

export default function DashboardPage() {
  const [booted, setBooted] = useState(false);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [filter, setFilter] = useState<PetitionState | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<Petition[]>('/petitions');
      setPetitions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach the Administratum archive');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Any petition changing state, anywhere in the system, means this
  // dashboard's counts are stale — so any event is a reason to re-fetch.
  usePetitionUpdates(useCallback(() => load(), [load]));

  const counts = ALL_STATES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = petitions.filter((p) => p.state === s).length;
    return acc;
  }, {});

  const visible =
    filter === 'ALL' ? petitions : petitions.filter((p) => p.state === filter);

  if (!booted) {
    return <BootSequence onDone={() => setBooted(true)} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg tracking-widest text-term-green">
        {'>> '}PETITION QUEUE OVERVIEW
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ALL_STATES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? 'ALL' : s)}
            className={`border px-3 py-2 text-left transition-colors ${
              filter === s
                ? 'border-term-green bg-term-border'
                : 'border-term-border hover:border-term-greenDim'
            }`}
          >
            <div className="text-2xl text-term-green">{counts[s] ?? 0}</div>
            <div className="text-[10px] tracking-widest text-term-greenDim">
              {s.replace('_', ' ')}
            </div>
          </button>
        ))}
      </div>

      <TerminalPanel
        title={filter === 'ALL' ? 'All Petitions' : `Filtered: ${filter}`}
      >
        {loading && <p className="text-term-greenDim">Reading archive...</p>}
        {error && <p className="text-term-red">ERROR: {error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="text-term-greenDim">No petitions match this filter.</p>
        )}
        <ul className="space-y-2">
          {visible.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-1 border-b border-term-border pb-2 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm text-term-text">{p.type}</div>
                <div className="text-[10px] text-term-greenDim">
                  {p.petitioner?.name ?? p.petitionerId} · {p.impact} IMPACT ·{' '}
                  {p.id.slice(0, 8)}
                </div>
              </div>
              <StatusBadge state={p.state} />
            </li>
          ))}
        </ul>
      </TerminalPanel>
    </div>
  );
}
