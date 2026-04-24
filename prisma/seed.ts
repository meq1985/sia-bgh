import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const lineNames = ["SMD1", "SMD2", "SMD3", "SMD4", "SMD5", "SMD6", "SMD7", "SMD8"];
  for (const name of lineNames) {
    await prisma.smdLine.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`[seed] Líneas SMD1..SMD8 aseguradas.`);

  const adminUsername = process.env.ADMIN_INITIAL_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "admin123";
  const adminFullName = process.env.ADMIN_INITIAL_FULLNAME || "Administrador";

  const existing = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash,
        fullName: adminFullName,
        role: Role.ADMIN,
      },
    });
    console.log(`[seed] Admin inicial creado: ${adminUsername}`);
  } else {
    console.log(`[seed] Admin "${adminUsername}" ya existe, se omite.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
