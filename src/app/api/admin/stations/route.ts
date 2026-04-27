import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/rbac";

const createSchema = z.object({
  name: z.string().trim().min(1).max(64),
});

export async function GET() {
  await requireSession();
  const rows = await prisma.station.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { failures: true, lineStops: true } } },
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
    const created = await prisma.station.create({ data: { name: parsed.data.name } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("Unique")) {
      return NextResponse.json({ error: "Ya existe una estación con ese nombre" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
