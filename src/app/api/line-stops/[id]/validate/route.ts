import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canValidateLineStop, requireSession } from "@/lib/rbac";

const bodySchema = z.object({
  decision: z.enum(["VALIDATED", "REJECTED"]),
  comment: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!canValidateLineStop(session.user.role)) {
    return NextResponse.json({ error: "No autorizado a validar paradas" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.decision === "REJECTED" && !parsed.data.comment?.trim()) {
    return NextResponse.json(
      { error: "El rechazo requiere un comentario explicando el motivo" },
      { status: 400 }
    );
  }
  const stop = await prisma.lineStop.findUnique({ where: { id } });
  if (!stop) return NextResponse.json({ error: "Parada no encontrada" }, { status: 404 });
  if (!stop.endedAt) {
    return NextResponse.json(
      { error: "No se puede validar una parada en curso. Finalizala primero." },
      { status: 400 }
    );
  }

  const updated = await prisma.lineStop.update({
    where: { id },
    data: {
      status: parsed.data.decision,
      validatedById: session.user.id,
      validatedAt: new Date(),
      validatedComment: parsed.data.comment ?? null,
    },
  });
  return NextResponse.json(updated);
}
