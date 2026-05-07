import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { isWoComplete, producedFromMagazines } from "@/lib/wo";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "SUPERVISOR");
  const { id } = await params;
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: { magazines: { select: { placasCount: true } } },
  });
  if (!wo) return NextResponse.json({ error: "WO no encontrada" }, { status: 404 });
  if (wo.status !== "CLOSED") {
    return NextResponse.json({ error: "La WO no está cerrada" }, { status: 400 });
  }
  const produced = producedFromMagazines(wo.magazines);
  if (isWoComplete(produced, wo.totalQty)) {
    return NextResponse.json(
      { error: "WO está al 100%, no se puede reabrir" },
      { status: 400 }
    );
  }
  const updated = await prisma.workOrder.update({
    where: { id },
    data: { status: "OPEN", closedAt: null, closedById: null },
  });
  return NextResponse.json(updated);
}
