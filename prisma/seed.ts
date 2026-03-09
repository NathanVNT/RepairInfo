import { 
  PrismaClient 
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Utilisateurs par défaut
  const users = [
    {
      email: 'admin@atelier.com',
      nom: 'Administrateur',
      role: 'admin',
      password: 'admin123', // TODO: hasher avec bcryptjs
    },
    {
      email: 'technicien@atelier.com',
      nom: 'Technicien',
      role: 'technicien',
      password: 'tech123',
    },
    {
      email: 'stock@atelier.com',
      nom: 'Gestionnaire Stock',
      role: 'gestionnaire_stock',
      password: 'stock123',
    },
    {
      email: 'finance@atelier.com',
      nom: 'Gestionnaire Finance',
      role: 'gestionnaire_finance',
      password: 'finance123',
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!existing) {
      await prisma.user.create({
        data: user,
      });
      console.log(`✅ Created user: ${user.email}`);
    } else {
      console.log(`⏭️  User already exists: ${user.email}`);
    }
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
