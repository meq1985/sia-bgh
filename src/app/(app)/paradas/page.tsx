import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { defaultShiftForNow } from "@/lib/shift";
import { ParadasClient } from "./client";

type SearchParams = Promise<{
  smdLineId?: string;
  stationId?: string;
  status?: string;
  shift?: string;
  code?: string;
  open?: string;
  from?: string;
  to?: string;
}>;

export default async function ParadasPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireSession();
  const sp = await searchParams;

  const where: Record<string, unknown> = {};
  if (sp.smdLineId) where.smdLineId = Number(sp.smdLineId);
  if (sp.stationId) where.stationId = Number(sp.stationId);
  if (sp.status === "PENDING" || sp.status === "VALIDATED" || sp.status === "REJECTED") {
    where.status = sp.status;
  }
  if (sp.shift === "MORNING" || sp.shift === "AFTERNOON") where.shift = sp.shift;
  if (sp.code) where.code = Number(sp.code);
  if (sp.open === "true") where.endedAt = null;
  if (sp.from || sp.to) {
    const range: { gte?: Date; lte?: Date } = {};
    if (sp.from) range.gte = new Date(sp.from);
    if (sp.to) {
      const d = new Date(sp.to);
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
    where.startedAt = range;
  }

  const [stops, lines, stations, failures, openWOs, myActive, validators] = await Promise.all([
    prisma.lineStop.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 200,
      include: {
        smdLine: { select: { id: true, name: true } },
        workOrder: { select: { id: true, woNumber: true, productCode: true } },
        station: { select: { id: true, name: true } },
        commonFailure: { select: { id: true, label: true } },
        reportedBy: { select: { id: true, fullName: true } },
        validatedBy: { select: { id: true, fullName: true } },
        interventionUser: { select: { id: true, fullName: true, role: true } },
      },
    }),
    prisma.smdLine.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.station.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.commonFailure.findMany({
      where: { active: true },
      orderBy: { label: "asc" },
      select: { id: true, stationId: true, label: true },
    }),
    prisma.workOrder.findMany({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
      select: { id: true, woNumber: true, productCode: true, smdLineId: true },
    }),
    prisma.lineStop.findMany({
      where: { reportedById: session.user.id, endedAt: null },
      orderBy: { startedAt: "desc" },
      include: {
        smdLine: { select: { name: true } },
        station: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        active: true,
        role: { in: ["SUPERVISOR", "MANTENIMIENTO", "PROGRAMACION", "ADMIN"] },
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      select: { id: true, fullName: true, role: true },
    }),
  ]);

  return (
    <ParadasClient
      role={session.user.role}
      currentUserId={session.user.id}
      myActive={myActive}
      stops={stops}
      lines={lines}
      stations={stations}
      failures={failures}
      openWOs={openWOs}
      validators={validators}
      defaultShift={defaultShiftForNow()}
      initialFilters={sp}
    />
  );
}
