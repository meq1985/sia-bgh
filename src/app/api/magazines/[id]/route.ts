import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const updateSchema = z.object({
  magazineCode: z.string().trim().min(1).max(64).optional(),
  placasCount: z.coerce.number().int().positive().optional(),
  shift: z.enum(["MORNING", "AFTERNOON"]).optional(),
  smdLineId: z.coerce.number().int().positive().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "SUPERVISOR");
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const existing = await prisma.magazine.findUnique({ where: { id }, include: { workOrder: true } });
  if (!existing) return NextResponse.json({ error: "No existe" }, { status: 404 });

  if (parsed.data.placasCount && parsed.data.placasCount > existing.workOrder.magazineCapacity) {
    return NextResponse.json(
      { error: `placasCount supera la capacidad (${existing.workOrder.magazineCapacity})` },
      { status: 400 }
    );
  }

  const updated = await prisma.magazine.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  await prisma.magazine.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
