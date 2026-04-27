import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const updateSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["ADMIN", "SUPERVISOR", "OPERADOR", "MANTENIMIENTO", "PROGRAMACION"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).max(128).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (id === session.user.id && parsed.data.active === false) {
    return NextResponse.json({ error: "No podés desactivar tu propio usuario" }, { status: 400 });
  }
  if (id === session.user.id && parsed.data.role && parsed.data.role !== "ADMIN") {
    return NextResponse.json({ error: "No podés degradar tu propio rol" }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, fullName: true, role: true, active: true },
  });
  return NextResponse.json(updated);
}
