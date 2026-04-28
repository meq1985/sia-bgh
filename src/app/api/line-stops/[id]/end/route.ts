import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/rbac";

const ELIGIBLE_INTERVENTION_ROLES = [
  "SUPERVISOR",
  "MANTENIMIENTO",
  "PROGRAMACION",
  "ADMIN",
] as const;

const bodySchema = z.object({
  interventionRole: z.enum(ELIGIBLE_INTERVENTION_ROLES),
  interventionUserId: z.string().min(1),
  endedAt: z.string().datetime().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const stop = await prisma.lineStop.findUnique({ where: { id } });
  if (!stop) return NextResponse.json({ error: "Parada no encontrada" }, { status: 404 });
  if (stop.endedAt) return NextResponse.json(stop);

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const intervener = await prisma.user.findUnique({
    where: { id: parsed.data.interventionUserId },
    select: { id: true, role: true, active: true },
  });
  if (!intervener || !intervener.active) {
    return NextResponse.json({ error: "Usuario intervinente inválido" }, { status: 400 });
  }
  if (intervener.role !== parsed.data.interventionRole) {
    return NextResponse.json(
      { error: "El rol seleccionado no coincide con el del usuario" },
      { status: 400 }
    );
  }

  const endedAt = parsed.data.endedAt ? new Date(parsed.data.endedAt) : new Date();
  if (endedAt.getTime() < stop.startedAt.getTime()) {
    return NextResponse.json(
      { error: "La hora de finalización no puede ser anterior al inicio" },
      { status: 400 }
    );
  }

  const updated = await prisma.lineStop.update({
    where: { id },
    data: {
      endedAt,
      interventionRole: parsed.data.interventionRole,
      interventionUserId: parsed.data.interventionUserId,
    },
  });
  return NextResponse.json(updated);
}
