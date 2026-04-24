import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/rbac";

const createSchema = z.object({
  reportDate: z.string().min(1),
  shift: z.enum(["MORNING", "AFTERNOON"]),
  smdLineId: z.coerce.number().int().positive(),
  workOrderId: z.string().min(1),
  defectiveQty: z.coerce.number().int().nonnegative(),
});

export async function GET(req: NextRequest) {
  await requireSession();
  const sp = req.nextUrl.searchParams;
  const where: Record<string, unknown> = {};
  if (sp.get("workOrderId")) where.workOrderId = sp.get("workOrderId");
  if (sp.get("smdLineId")) where.smdLineId = Number(sp.get("smdLineId"));
  if (sp.get("shift")) where.shift = sp.get("shift");
  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) {
    const range: { gte?: Date; lte?: Date } = {};
    if (from) range.gte = new Date(from);
    if (to) range.lte = new Date(to);
    where.reportDate = range;
  }

  const rows = await prisma.defectiveReport.findMany({
    where,
    orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
    include: {
      smdLine: { select: { name: true } },
      workOrder: { select: { woNumber: true, productCode: true } },
      reportedBy: { select: { fullName: true, username: true } },
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { reportDate, ...rest } = parsed.data;
  const date = new Date(reportDate);
  date.setHours(0, 0, 0, 0);

  const created = await prisma.defectiveReport.create({
    data: {
      ...rest,
      reportDate: date,
      reportedById: session.user.id,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
