import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(64).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const stationId = Number(id);
  if (!Number.isFinite(stationId)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const updated = await prisma.station.update({
      where: { id: stationId },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const stationId = Number(id);
  if (!Number.isFinite(stationId)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }
  const stopsCount = await prisma.lineStop.count({ where: { stationId } });
  if (stopsCount > 0) {
    return NextResponse.json(
      { error: `No se puede borrar: ${stopsCount} paradas la usan. Desactivala en su lugar.` },
      { status: 400 }
    );
  }
  await prisma.station.delete({ where: { id: stationId } });
  return NextResponse.json({ ok: true });
}
