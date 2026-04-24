import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
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
