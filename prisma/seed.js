const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@msh.com";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "MSH Admin",
      email: adminEmail,
      password: await bcrypt.hash("123456", 10),
      role: "ADMIN",
    },
  });

  const services = [
    {
      name: "Visita técnica",
      description: "Diagnóstico e avaliação no local",
      durationMin: 60,
      basePrice: 15000,
    },
    {
      name: "Instalação hidráulica",
      description: "Instalação e adequações",
      durationMin: 120,
      basePrice: 35000,
    },
    {
      name: "Manutenção/Conserto",
      description: "Reparo em vazamentos e troca de peças",
      durationMin: 90,
      basePrice: 25000,
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { name: s.name },
      update: { ...s, active: true },
      create: s,
    });
  }

  // Seg a Sex 08:00-18:00
  for (let weekday = 1; weekday <= 5; weekday++) {
    await prisma.businessHours.upsert({
      where: { weekday },
      update: { startMin: 8 * 60, endMin: 18 * 60, active: true },
      create: { weekday, startMin: 8 * 60, endMin: 18 * 60, active: true },
    });
  }

  console.log("Seed OK:", admin.email, "senha: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
