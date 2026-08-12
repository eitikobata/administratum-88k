'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePetitionUpdates } from '@/lib/usePetitionUpdates';
import type { Petition, PetitionImpact, Petitioner } from '@/lib/types';
import { TerminalPanel } from '@/components/TerminalPanel';
import { StatusBadge } from '@/components/StatusBadge';

export default function PetitionerConsolePage() {
  const [petitioners, setPetitioners] = useState<Petitioner[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [type, setType] = useState('');
  const [impact, setImpact] = useState<PetitionImpact>('LOW');
  const [notes, setNotes] = useState('');

  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPetitioners = useCallback(async () => {
    const data = await api.get<Petitioner[]>('/petitioners');
    setPetitioners(data);
    if (!selectedId && data.length > 0) setSelectedId(data[0].id);
  }, [selectedId]);

  const loadPetitions = useCallback(async () => {
    const data = await api.get<Petition[]>('/petitions');
    setPetitions(data);
  }, []);

  useEffect(() => {
    loadPetitioners();
    loadPetitions();
  }, [loadPetitioners, loadPetitions]);

  usePetitionUpdates(useCallback(() => loadPetitions(), [loadPetitions]));

  const myPetitions = petitions.filter((p) => p.petitionerId === selectedId);

  async function handleCreatePetitioner(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const petitioner = await api.post<Petitioner>('/petitioners', {
        name: newName,
        email: newEmail,
      });
      setNewName('');
      setNewEmail('');
      await loadPetitioners();
      setSelectedId(petitioner.id);
      setStatus(`Registered petitioner ${petitioner.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register petitioner');
    }
  }

  async function handleCreatePetition(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedId) {
      setError('Select or register a petitioner first.');
      return;
    }
    try {
      let payload: Record<string, unknown> | undefined;
      if (notes.trim()) payload = { notes: notes.trim() };

      const petition = await api.post<Petition>('/petitions', {
        petitionerId: selectedId,
        type,
        impact,
        payload,
      });
      setType('');
      setNotes('');
      await loadPetitions();
      setStatus(`Petition ${petition.id.slice(0, 8)} filed as DRAFT. Submit it below when ready.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not file petition');
    }
  }

  async function handleSubmit(petitionId: string) {
    setError(null);
    try {
      await api.post(`/petitions/${petitionId}/submit`);
      await loadPetitions();
      setStatus(`Petition ${petitionId.slice(0, 8)} submitted for review.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit petition');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg tracking-widest text-term-green">
        {'>> '}PETITIONER CONSOLE
      </h1>

      {status && <p className="text-xs text-term-green">{status}</p>}
      {error && <p className="text-xs text-term-red">ERROR: {error}</p>}

      <TerminalPanel title="Identify Yourself">
        <label className="mb-1 block text-[10px] tracking-widest text-term-greenDim">
          ACTING AS PETITIONER
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="mb-4 w-full border border-term-border bg-term-bg p-2 text-term-text"
        >
          <option value="">— select —</option>
          {petitioners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.email})
            </option>
          ))}
        </select>

        <form onSubmit={handleCreatePetitioner} className="flex flex-wrap gap-2">
          <input
            required
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 border border-term-border bg-term-bg p-2 text-term-text placeholder:text-term-greenDim"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 border border-term-border bg-term-bg p-2 text-term-text placeholder:text-term-greenDim"
          />
          <button
            type="submit"
            className="border border-term-green px-4 py-2 text-term-green hover:bg-term-border"
          >
            Register New
          </button>
        </form>
      </TerminalPanel>

      <TerminalPanel title="File a New Petition">
        <form onSubmit={handleCreatePetition} className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] tracking-widest text-term-greenDim">
              PETITION TYPE
            </label>
            <input
              required
              placeholder="e.g. PLANET_COLONIZATION"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-term-border bg-term-bg p-2 text-term-text placeholder:text-term-greenDim"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] tracking-widest text-term-greenDim">
              IMPACT ({impact === 'HIGH' ? '2 approvals required' : '1 approval required'})
            </label>
            <select
              value={impact}
              onChange={(e) => setImpact(e.target.value as PetitionImpact)}
              className="w-full border border-term-border bg-term-bg p-2 text-term-text"
            >
              <option value="LOW">LOW</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] tracking-widest text-term-greenDim">
              NOTES (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-term-border bg-term-bg p-2 text-term-text placeholder:text-term-greenDim"
              placeholder="Any detail worth recording alongside the petition"
            />
          </div>
          <button
            type="submit"
            className="border border-term-green px-4 py-2 text-term-green hover:bg-term-border"
          >
            File Petition
          </button>
        </form>
      </TerminalPanel>

      <TerminalPanel title="My Petitions">
        {myPetitions.length === 0 && (
          <p className="text-term-greenDim">No petitions on record for this petitioner.</p>
        )}
        <ul className="space-y-3">
          {myPetitions.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2 border-b border-term-border pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm text-term-text">{p.type}</div>
                <div className="text-[10px] text-term-greenDim">
                  {p.impact} IMPACT · {p.id.slice(0, 8)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge state={p.state} />
                {p.state === 'DRAFT' && (
                  <button
                    onClick={() => handleSubmit(p.id)}
                    className="border border-term-amber px-3 py-1 text-xs text-term-amber hover:bg-term-border"
                  >
                    Submit
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </TerminalPanel>
    </div>
  );
}
