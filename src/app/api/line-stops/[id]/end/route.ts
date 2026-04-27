import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/rbac";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const stop = await prisma.lineStop.findUnique({ where: { id } });
  if (!stop) return NextResponse.json({ error: "Parada no encontrada" }, { status: 404 });
  if (stop.endedAt) return NextResponse.json(stop);
  const updated = await prisma.lineStop.update({
    where: { id },
    data: { endedAt: new Date() },
  });
  return NextResponse.json(updated);
}
