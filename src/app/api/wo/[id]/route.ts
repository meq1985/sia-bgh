import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const baseFields = {
  woNumber: z.string().trim().min(1).max(64).optional(),
  productCode: z.string().trim().min(1).max(64).optional(),
  totalQty: z.coerce.number().int().positive().optional(),
  dailyTargetQty: z.coerce.number().int().nonnegative().optional(),
  magazineCapacity: z.coerce.number().int().refine((n) => n === 17 || n === 25 || n === 50, {
    message: "magazineCapacity debe ser 17, 25 o 50",
  }).optional(),
  troquel: z.coerce.number().int().positive().optional(),
  smdLineId: z.coerce.number().int().positive().optional(),
};

const updateSchema = z.object(baseFields);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "SUPERVISOR");
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: { _count: { select: { magazines: true } } },
  });
  if (!wo) return NextResponse.json({ error: "WO no encontrada" }, { status: 404 });

  const data = parsed.data;
  const hasMagazines = wo._count.magazines > 0;

  if (hasMagazines) {
    if (data.woNumber !== undefined && data.woNumber !== wo.woNumber) {
      return NextResponse.json(
        { error: "No se puede cambiar woNumber con magazines cargados" },
        { status: 400 }
      );
    }
    if (data.smdLineId !== undefined && data.smdLineId !== wo.smdLineId) {
      return NextResponse.json(
        { error: "No se puede cambiar la línea con magazines cargados" },
        { status: 400 }
      );
    }
    if (data.troquel !== undefined && data.troquel !== wo.troquel) {
      return NextResponse.json(
        { error: "No se puede cambiar el troquel con magazines cargados" },
        { status: 400 }
      );
    }
  }

  if (data.smdLineId !== undefined) {
    const line = await prisma.smdLine.findUnique({ where: { id: data.smdLineId } });
    if (!line) return NextResponse.json({ error: "Línea inválida" }, { status: 400 });
  }

  try {
    const updated = await prisma.workOrder.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "woNumber ya existe" }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "SUPERVISOR");
  const { id } = await params;
  const count = await prisma.magazine.count({ where: { workOrderId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `No se puede borrar: hay ${count} magazines asociados` },
      { status: 400 }
    );
  }
  await prisma.workOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
