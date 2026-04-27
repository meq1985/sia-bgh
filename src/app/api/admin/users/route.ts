import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const createSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9._-]+$/),
  fullName: z.string().trim().min(1).max(120),
  password: z.string().min(6).max(128),
  role: z.enum(["ADMIN", "SUPERVISOR", "OPERADOR", "MANTENIMIENTO", "PROGRAMACION"]),
});

export async function GET() {
  await requireRole("ADMIN");
  const rows = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, username: true, fullName: true, role: true, active: true, createdAt: true,
    },
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
  const { password, ...rest } = parsed.data;
  try {
    const created = await prisma.user.create({
      data: { ...rest, passwordHash: await bcrypt.hash(password, 10) },
      select: { id: true, username: true, fullName: true, role: true, active: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("Unique")) {
      return NextResponse.json({ error: "Ese usuario ya existe" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
