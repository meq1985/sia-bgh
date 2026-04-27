import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/rbac";

const createSchema = z.object({
  stationId: z.coerce.number().int().positive(),
  label: z.string().trim().min(1).max(120),
});

export async function GET(req: NextRequest) {
  await requireSession();
  const sp = req.nextUrl.searchParams;
  const stationId = sp.get("stationId");
  const where: Record<string, unknown> = {};
  if (stationId) where.stationId = Number(stationId);
  const rows = await prisma.commonFailure.findMany({
    where,
    orderBy: [{ stationId: "asc" }, { label: "asc" }],
    include: { station: { select: { name: true } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await requireRole("ADMIN");
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const created = await prisma.commonFailure.create({
      data: { stationId: parsed.data.stationId, label: parsed.data.label },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("Unique")) {
      return NextResponse.json(
        { error: "Esa falla ya existe para esa estación" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
