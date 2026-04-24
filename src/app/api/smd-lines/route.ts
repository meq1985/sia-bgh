import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/rbac";

export async function GET() {
  await requireSession();
  const lines = await prisma.smdLine.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(lines);
}
