import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canValidateLineStop, requireSession } from "@/lib/rbac";
import { VALID_STOP_CODES } from "@/lib/stopCodes";

const patchSchema = z.object({
  smdLineId: z.coerce.number().int().positive().optional(),
  workOrderId: z.string().nullable().optional(),
  stationId: z.coerce.number().int().positive().optional(),
  code: z.coerce
    .number()
    .int()
    .refine((v) => VALID_STOP_CODES.has(v), { message: "Código inválido" })
    .optional(),
  commonFailureId: z.coerce.number().int().positive().nullable().optional(),
  customFailure: z.string().trim().max(200).nullable().optional(),
  comment: z.string().trim().max(500).nullable().optional(),
  shift: z.enum(["MORNING", "AFTERNOON"]).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const stop = await prisma.lineStop.findUnique({ where: { id } });
  if (!stop) return NextResponse.json({ error: "Parada no encontrada" }, { status: 404 });

  const isValidator = canValidateLineStop(session.user.role);
  const isOwner = stop.reportedById === session.user.id;
  const allowed =
    isValidator || (isOwner && stop.status === "PENDING");
  if (!allowed) {
    return NextResponse.json({ error: "No autorizado a editar esta parada" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const finalStationId = data.stationId ?? stop.stationId;
  if (data.commonFailureId) {
    const fail = await prisma.commonFailure.findUnique({
      where: { id: data.commonFailureId },
    });
    if (!fail || fail.stationId !== finalStationId) {
      return NextResponse.json(
        { error: "La falla común no pertenece a la estación seleccionada" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.lineStop.update({
    where: { id },
    data: {
      ...(data.smdLineId !== undefined && { smdLineId: data.smdLineId }),
      ...(data.workOrderId !== undefined && { workOrderId: data.workOrderId }),
      ...(data.stationId !== undefined && { stationId: data.stationId }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.commonFailureId !== undefined && { commonFailureId: data.commonFailureId }),
      ...(data.customFailure !== undefined && { customFailure: data.customFailure }),
      ...(data.comment !== undefined && { comment: data.comment }),
      ...(data.shift !== undefined && { shift: data.shift }),
      ...(data.startedAt !== undefined && { startedAt: new Date(data.startedAt) }),
      ...(data.endedAt !== undefined && {
        endedAt: data.endedAt ? new Date(data.endedAt) : null,
      }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo ADMIN puede borrar paradas" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.lineStop.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
