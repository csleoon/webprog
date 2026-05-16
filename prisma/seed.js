const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@voting.local' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@voting.local',
      passwordHash: adminHash,
      role: 'admin',
    },
  });

  await prisma.poll.upsert({
    where: { id: 1 },
    update: {},
    create: {
      question: 'Mi legyen a következő projekt programozási nyelve?',
      isActive: true,
      options: {
        create: [
          { text: 'JavaScript' },
          { text: 'Python' },
          { text: 'Go' },
          { text: 'Rust' },
        ],
      },
    },
  });

  await prisma.poll.upsert({
    where: { id: 2 },
    update: {},
    create: {
      question: 'Melyik frontend keretrendszert tanuljuk meg?',
      isActive: true,
      options: {
        create: [
          { text: 'React' },
          { text: 'Vue' },
          { text: 'Angular' },
          { text: 'Svelte' },
        ],
      },
    },
  });

  await prisma.poll.upsert({
    where: { id: 3 },
    update: {},
    create: {
      question: 'Mikor tartsuk a következő csapattalálkozót?',
      isActive: true,
      options: {
        create: [
          { text: 'Hétfőn' },
          { text: 'Szerdán' },
          { text: 'Pénteken' },
        ],
      },
    },
  });

  console.log(`Seed kész. Admin: ${admin.email} / admin123`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
