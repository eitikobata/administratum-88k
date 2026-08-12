import { PetitionImpact } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// A small fixed cast the simulator reuses every tick, instead of creating
// a fresh throwaway petitioner/approver on every run (that would flood the
// petitioners/approvers tables with one-off junk forever, which defeats
// the whole point of keeping the demo tidy).
const SIMULATED_PETITIONERS = [
  { name: 'Provincial Governor Thessaly', email: 'sim.thessaly@88k.dev' },
  { name: 'Logistics Overseer Bram', email: 'sim.bram@88k.dev' },
  { name: 'Colonial Registrar Ilvez', email: 'sim.ilvez@88k.dev' },
];

const SIMULATED_APPROVERS = [
  { name: 'Senior Clerk Draven', email: 'sim.draven@88k.dev' },
  { name: 'Auditor Prime Kess', email: 'sim.kess@88k.dev' },
];

const SIMULATED_PETITION_TYPES: Array<{
  type: string;
  impact: PetitionImpact;
  notes: string;
}> = [
  { type: 'PLANET_COLONIZATION', impact: 'HIGH', notes: 'New settlement proposal pending resource survey.' },
  { type: 'RESOURCE_ALLOCATION', impact: 'LOW', notes: 'Routine quarterly supply request.' },
  { type: 'FLEET_TRANSFER', impact: 'HIGH', notes: 'Escort vessels reassigned to frontier patrol.' },
  { type: 'TERRITORIAL_DECREE', impact: 'LOW', notes: 'Boundary adjustment between adjacent districts.' },
  { type: 'VOX_NETWORK_EXPANSION', impact: 'LOW', notes: 'Additional relay towers for the outer settlements.' },
];

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Idempotent: safe to call on every simulator tick. Only inserts an actor
// the first time it's missing (matched by email), so re-running this never
// creates duplicates.
export async function ensureSimulatedActors(prisma: PrismaService) {
  for (const p of SIMULATED_PETITIONERS) {
    await prisma.petitioner.upsert({
      where: { email: p.email },
      update: {},
      create: p,
    });
  }
  for (const a of SIMULATED_APPROVERS) {
    await prisma.approver.upsert({
      where: { email: a.email },
      update: {},
      create: a,
    });
  }
}

export async function pickSimulatedPetitioner(prisma: PrismaService) {
  const emails = SIMULATED_PETITIONERS.map((p) => p.email);
  const petitioners = await prisma.petitioner.findMany({
    where: { email: { in: emails } },
  });
  return pickRandom(petitioners);
}

export async function listSimulatedApprovers(prisma: PrismaService) {
  const emails = SIMULATED_APPROVERS.map((a) => a.email);
  return prisma.approver.findMany({ where: { email: { in: emails } } });
}

export function pickPetitionTemplate() {
  return pickRandom(SIMULATED_PETITION_TYPES);
}
