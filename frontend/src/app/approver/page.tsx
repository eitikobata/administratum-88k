'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePetitionUpdates } from '@/lib/usePetitionUpdates';
import type { ApprovalDecision, Approver, Petition } from '@/lib/types';
import { TerminalPanel } from '@/components/TerminalPanel';
import { StatusBadge } from '@/components/StatusBadge';

export default function ApproverConsolePage() {
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [pending, setPending] = useState<Petition[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadApprovers = useCallback(async () => {
    const data = await api.get<Approver[]>('/approvers');
    setApprovers(data);
    setSelectedId((current) => current || (data[0]?.id ?? ''));
  }, []);

  const loadPending = useCallback(async () => {
    const data = await api.get<Petition[]>('/petitions?state=PENDING_APPROVAL');
    setPending(data);
  }, []);

  useEffect(() => {
    loadApprovers();
    loadPending();
  }, [loadApprovers, loadPending]);

  usePetitionUpdates(useCallback(() => loadPending(), [loadPending]));

  async function decide(petitionId: string, decision: ApprovalDecision) {
    setError(null);
    if (!selectedId) {
      setError('Select which approver is deciding first.');
      return;
    }
    try {
      await api.post(`/petitions/${petitionId}/approvals`, {
        approverId: selectedId,
        decision,
        comment: comments[petitionId]?.trim() || undefined,
      });
      await loadPending();
      setStatus(
        `Recorded ${decision} on petition ${petitionId.slice(0, 8)}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record decision');
    }
  }

  const selectedApprover = approvers.find((a) => a.id === selectedId);

  return (
    <div className="space-y-6">
      <h1 className="text-lg tracking-widest text-term-green">
        {'>> '}APPROVER CONSOLE
      </h1>

      {status && <p className="text-xs text-term-green">{status}</p>}
      {error && <p className="text-xs text-term-red">ERROR: {error}</p>}

      <TerminalPanel title="Identify Yourself">
        <label className="mb-1 block text-[10px] tracking-widest text-term-greenDim">
          ACTING AS APPROVER
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full border border-term-border bg-term-bg p-2 text-term-text"
        >
          <option value="">— select —</option>
          {approvers.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.email})
            </option>
          ))}
        </select>
        {approvers.length === 0 && (
          <p className="mt-2 text-[10px] text-term-greenDim">
            No approvers registered yet — create one via POST /approvers.
          </p>
        )}
      </TerminalPanel>

      <TerminalPanel title="Pending Your Decision">
        {pending.length === 0 && (
          <p className="text-term-greenDim">No petitions awaiting approval.</p>
        )}
        <ul className="space-y-4">
          {pending.map((p) => {
            const myVote = p.approvals?.find((a) => a.approverId === selectedId);
            return (
              <li key={p.id} className="border-b border-term-border pb-4 last:border-0">
                <div className="mb-1 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-term-text">{p.type}</div>
                    <div className="text-[10px] text-term-greenDim">
                      {p.petitioner?.name ?? p.petitionerId} · {p.impact} IMPACT ·{' '}
                      {p.approvals?.length ?? 0}/{p.requiredApprovals} approvals so far
                    </div>
                  </div>
                  <StatusBadge state={p.state} />
                </div>

                {myVote ? (
                  <p className="text-xs text-term-amber">
                    You already recorded {myVote.decision} on this petition.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      placeholder="Optional comment"
                      value={comments[p.id] ?? ''}
                      onChange={(e) =>
                        setComments((c) => ({ ...c, [p.id]: e.target.value }))
                      }
                      className="flex-1 border border-term-border bg-term-bg p-2 text-xs text-term-text placeholder:text-term-greenDim"
                    />
                    <button
                      onClick={() => decide(p.id, 'APPROVED')}
                      className="border border-term-green px-3 py-2 text-xs text-term-green hover:bg-term-border"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide(p.id, 'REJECTED')}
                      className="border border-term-red px-3 py-2 text-xs text-term-red hover:bg-term-border"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </TerminalPanel>

      {selectedApprover && (
        <p className="text-[10px] text-term-greenDim">
          Deciding as {selectedApprover.name} &lt;{selectedApprover.email}&gt;
        </p>
      )}
    </div>
  );
}
