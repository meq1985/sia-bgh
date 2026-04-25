import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/rbac";

const createSchema = z.object({
  woNumber: z.string().trim().min(1).max(64),
  productCode: z.string().trim().min(1).max(64),
  totalQty: z.coerce.number().int().positive(),
  dailyTargetQty: z.coerce.number().int().nonnegative(),
  magazineCapacity: z.coerce.number().int().refine((v) => [17, 25, 50].includes(v), {
    message: "magazineCapacity debe ser 17, 25 o 50",
  }),
  smdLineId: z.coerce.number().int().positive(),
});

export async function GET(req: NextRequest) {
  await requireSession();
  const sp = req.nextUrl.searchParams;
  const where: Record<string, unknown> = {};
  const status = sp.get("status");
  if (status === "OPEN" || status === "CLOSED") where.status = status;
  const smdLineId = sp.get("smdLineId");
  if (smdLineId) where.smdLineId = Number(smdLineId);
  const rows = await prisma.workOrder.findMany({
    where,
    orderBy: { openedAt: "desc" },
    include: {
      smdLine: { select: { id: true, name: true } },
      _count: { select: { magazines: true } },
      closedBy: { select: { fullName: true, username: true } },
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await requireRole("ADMIN", "SUPERVISOR");
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const created = await prisma.workOrder.create({ data: parsed.data });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("Unique")) {
      return NextResponse.json({ error: "Ya existe una WO con ese número" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
