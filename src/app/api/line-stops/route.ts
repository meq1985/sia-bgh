import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { defaultShiftForNow } from "@/lib/shift";

const createSchema = z.object({
  smdLineId: z.coerce.number().int().positive(),
  workOrderId: z.string().optional().nullable(),
  stationId: z.coerce.number().int().positive(),
  commonFailureId: z.coerce.number().int().positive().optional().nullable(),
  customFailure: z.string().trim().max(200).optional().nullable(),
  comment: z.string().trim().max(500).optional().nullable(),
  startedAt: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  await requireSession();
  const sp = req.nextUrl.searchParams;
  const where: Record<string, unknown> = {};

  const smdLineId = sp.get("smdLineId");
  if (smdLineId) where.smdLineId = Number(smdLineId);
  const stationId = sp.get("stationId");
  if (stationId) where.stationId = Number(stationId);
  const status = sp.get("status");
  if (status === "PENDING" || status === "VALIDATED" || status === "REJECTED") {
    where.status = status;
  }
  const shift = sp.get("shift");
  if (shift === "MORNING" || shift === "AFTERNOON") where.shift = shift;
  const code = sp.get("code");
  if (code) where.code = Number(code);
  const open = sp.get("open");
  if (open === "true") where.endedAt = null;

  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) {
    const range: { gte?: Date; lte?: Date } = {};
    if (from) range.gte = new Date(from);
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
    where.startedAt = range;
  }

  const limit = Math.min(Number(sp.get("limit") ?? 200), 1000);

  const rows = await prisma.lineStop.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      smdLine: { select: { id: true, name: true } },
      workOrder: { select: { id: true, woNumber: true, productCode: true } },
      station: { select: { id: true, name: true } },
      commonFailure: { select: { id: true, label: true } },
      reportedBy: { select: { id: true, fullName: true } },
      validatedBy: { select: { id: true, fullName: true } },
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const station = await prisma.station.findUnique({ where: { id: data.stationId } });
  if (!station || !station.active) {
    return NextResponse.json({ error: "Estación inválida o inactiva" }, { status: 400 });
  }

  if (data.commonFailureId) {
    const fail = await prisma.commonFailure.findUnique({ where: { id: data.commonFailureId } });
    if (!fail || fail.stationId !== data.stationId) {
      return NextResponse.json(
        { error: "La falla común no pertenece a esa estación" },
        { status: 400 }
      );
    }
  }

  // Auto-vinculación con WO si la línea tiene exactamente una WO abierta y no se mandó workOrderId
  let workOrderId = data.workOrderId ?? null;
  if (!workOrderId) {
    const openWos = await prisma.workOrder.findMany({
      where: { smdLineId: data.smdLineId, status: "OPEN" },
      select: { id: true },
      take: 2,
    });
    if (openWos.length === 1) workOrderId = openWos[0].id;
  }

  const startedAt = data.startedAt ? new Date(data.startedAt) : new Date();
  const shift = defaultShiftForNow(startedAt);

  const created = await prisma.lineStop.create({
    data: {
      smdLineId: data.smdLineId,
      workOrderId,
      stationId: data.stationId,
      commonFailureId: data.commonFailureId ?? null,
      customFailure: data.customFailure ?? null,
      comment: data.comment ?? null,
      shift,
      startedAt,
      reportedById: session.user.id,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
