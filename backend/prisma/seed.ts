import { PrismaClient, PetitionImpact } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const petitioner = await prisma.petitioner.upsert({
    where: { email: 'governor.varn@88k.dev' },
    update: {},
    create: {
      name: 'Governor Varn',
      email: 'governor.varn@88k.dev',
    },
  });

  const approverOne = await prisma.approver.upsert({
    where: { email: 'inquisitor.sael@88k.dev' },
    update: {},
    create: {
      name: 'Inquisitor Sael',
      email: 'inquisitor.sael@88k.dev',
    },
  });

  const approverTwo = await prisma.approver.upsert({
    where: { email: 'lord.marek@88k.dev' },
    update: {},
    create: {
      name: 'Lord Marek',
      email: 'lord.marek@88k.dev',
    },
  });

  await prisma.petition.create({
    data: {
      type: 'PLANET_COLONIZATION',
      impact: PetitionImpact.HIGH,
      requiredApprovals: 2,
      petitionerId: petitioner.id,
      payload: { planet: 'Kessar Prime', settlers: 40000 },
    },
  });

  console.log('Seed complete:', {
    petitioner: petitioner.email,
    approvers: [approverOne.email, approverTwo.email],
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
