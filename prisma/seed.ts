import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STATIONS_WITH_FAILURES: Record<string, string[]> = {
  loader: ["PCB no detectada", "Atasco en alimentador", "PCB doble", "Sensor sucio"],
  vacuum: ["Sin succión", "Manguera obstruida", "Bomba con falla"],
  inverter: ["PCB no se voltea", "Sensor de posición", "Atasco en volteo"],
  printer: [
    "Stencil sucio",
    "Falta pasta",
    "Pasta vencida",
    "Squeegee desgastado",
    "Mala alineación",
  ],
  spi: [
    "Rechazo por volumen",
    "Rechazo por offset",
    "Cámara sucia",
    "Iluminación deficiente",
  ],
  buffer: ["Buffer lleno", "Atasco", "Sensor de presencia"],
  "cm602-1": [
    "Feeder vacío",
    "Nozzle obstruido",
    "Error de visión",
    "Componente caído",
    "Pickup rate bajo",
  ],
  "cm602-2": [
    "Feeder vacío",
    "Nozzle obstruido",
    "Error de visión",
    "Componente caído",
    "Pickup rate bajo",
  ],
  "cm602-3": [
    "Feeder vacío",
    "Nozzle obstruido",
    "Error de visión",
    "Componente caído",
    "Pickup rate bajo",
  ],
  npm: ["Feeder vacío", "Nozzle obstruido", "Error de visión", "Componente caído"],
  "pre-aoi": ["Lámpara fundida", "Cámara sucia", "Calibración"],
  manual: ["Componente faltante", "Error de inserción"],
  horno: ["Temperatura fuera de perfil", "Conveyor atascado", "Falla en zonas"],
  "post-aoi": ["Lámpara fundida", "Cámara sucia", "Falsos positivos"],
  "ng-buffer": ["NG buffer lleno", "Atasco"],
  unloader: ["Atasco", "PCB no descargada"],
};

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

  for (const [stationName, failures] of Object.entries(STATIONS_WITH_FAILURES)) {
    const station = await prisma.station.upsert({
      where: { name: stationName },
      update: {},
      create: { name: stationName },
    });
    for (const label of failures) {
      await prisma.commonFailure.upsert({
        where: { stationId_label: { stationId: station.id, label } },
        update: {},
        create: { stationId: station.id, label },
      });
    }
  }
  console.log(`[seed] Estaciones y fallas comunes aseguradas.`);

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
