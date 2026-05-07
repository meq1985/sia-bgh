import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { isWoComplete, producedFromMagazines } from "@/lib/wo";

const createSchema = z.object({
  magazineCode: z.string().trim().min(1).max(64),
  workOrderId: z.string().min(1),
  smdLineId: z.coerce.number().int().positive(),
  placasCount: z.coerce.number().int().positive(),
  shift: z.enum(["MORNING", "AFTERNOON"]),
});

export async function GET(req: NextRequest) {
  await requireSession();
  const sp = req.nextUrl.searchParams;
  const where: Record<string, unknown> = {};

  const woId = sp.get("workOrderId");
  if (woId) where.workOrderId = woId;
  const lineId = sp.get("smdLineId");
  if (lineId) where.smdLineId = Number(lineId);
  const shift = sp.get("shift");
  if (shift === "MORNING" || shift === "AFTERNOON") where.shift = shift;
  const createdById = sp.get("createdById");
  if (createdById) where.createdById = createdById;

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
    where.createdAt = range;
  }

  const limit = Math.min(Number(sp.get("limit") ?? 100), 1000);

  const rows = await prisma.magazine.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      workOrder: { select: { woNumber: true, productCode: true, magazineCapacity: true } },
      smdLine: { select: { name: true } },
      createdBy: { select: { username: true, fullName: true } },
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

  const wo = await prisma.workOrder.findUnique({
    where: { id: data.workOrderId },
    include: { magazines: { select: { placasCount: true } } },
  });
  if (!wo) return NextResponse.json({ error: "WO no encontrada" }, { status: 404 });
  if (wo.status !== "OPEN") {
    return NextResponse.json({ error: "La WO está cerrada" }, { status: 400 });
  }
  if (data.smdLineId !== wo.smdLineId) {
    return NextResponse.json(
      { error: "La línea del magazine no coincide con la línea de la WO" },
      { status: 400 }
    );
  }
  if (data.placasCount > wo.magazineCapacity) {
    return NextResponse.json(
      { error: `placasCount supera la capacidad del magazine (${wo.magazineCapacity})` },
      { status: 400 }
    );
  }

  const produced = producedFromMagazines(wo.magazines);
  if (isWoComplete(produced, wo.totalQty)) {
    return NextResponse.json(
      { error: "WO ya completada al 100%" },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.magazine.create({
      data: {
        magazineCode: data.magazineCode,
        workOrderId: data.workOrderId,
        smdLineId: data.smdLineId,
        placasCount: data.placasCount,
        shift: data.shift,
        createdById: session.user.id,
      },
    });
    if (isWoComplete(produced + data.placasCount, wo.totalQty)) {
      await tx.workOrder.update({
        where: { id: wo.id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
          closedById: session.user.id,
        },
      });
    }
    return created;
  });

  return NextResponse.json(result, { status: 201 });
}
