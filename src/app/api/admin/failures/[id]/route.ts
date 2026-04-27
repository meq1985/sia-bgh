import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const patchSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const failId = Number(id);
  if (!Number.isFinite(failId)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const updated = await prisma.commonFailure.update({
      where: { id: failId },
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
  const failId = Number(id);
  if (!Number.isFinite(failId)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }
  const used = await prisma.lineStop.count({ where: { commonFailureId: failId } });
  if (used > 0) {
    return NextResponse.json(
      { error: `No se puede borrar: ${used} paradas la usan. Desactivala en su lugar.` },
      { status: 400 }
    );
  }
  await prisma.commonFailure.delete({ where: { id: failId } });
  return NextResponse.json({ ok: true });
}
