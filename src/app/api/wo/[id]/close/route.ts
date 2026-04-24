import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN", "SUPERVISOR");
  const { id } = await params;

  const wo = await prisma.workOrder.findUnique({ where: { id } });
  if (!wo) return NextResponse.json({ error: "WO no encontrada" }, { status: 404 });
  if (wo.status === "CLOSED") return NextResponse.json(wo);

  const updated = await prisma.workOrder.update({
    where: { id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closedById: session.user.id,
    },
  });
  return NextResponse.json(updated);
}
