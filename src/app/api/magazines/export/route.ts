import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  await requireSession();
  const sp = req.nextUrl.searchParams;
  const format = (sp.get("format") ?? "xlsx").toLowerCase();

  const where: Record<string, unknown> = {};
  const woId = sp.get("workOrderId");
  if (woId) where.workOrderId = woId;
  const lineId = sp.get("smdLineId");
  if (lineId) where.smdLineId = Number(lineId);
  const shift = sp.get("shift");
  if (shift === "MORNING" || shift === "AFTERNOON") where.shift = shift;
  const createdById = sp.get("createdById");
  if (createdById) where.createdById = createdById;
  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) {
    const range: { gte?: Date; lte?: Date } = {};
    if (from) range.gte = new Date(from);
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
    where.createdAt = range;
  }

  const rows = await prisma.magazine.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      workOrder: {
        select: { woNumber: true, productCode: true, magazineCapacity: true, troquel: true },
      },
      smdLine: { select: { name: true } },
      createdBy: { select: { username: true, fullName: true } },
    },
  });

  const flat = rows.map((r) => ({
    Fecha: r.createdAt.toISOString(),
    WO: r.workOrder.woNumber,
    Producto: r.workOrder.productCode,
    Linea: r.smdLine.name,
    CodigoMagazine: r.magazineCode,
    CapacidadWO: r.workOrder.magazineCapacity,
    Troquel: r.workOrder.troquel,
    Paneles: r.placasCount,
    Placas: r.placasCount * r.workOrder.troquel,
    Turno: r.shift === "MORNING" ? "Mañana" : "Tarde",
    Autor: r.createdBy.fullName,
    Usuario: r.createdBy.username,
  }));

  if (format === "csv") {
    const header = Object.keys(flat[0] ?? {
      Fecha: "", WO: "", Producto: "", Linea: "", CodigoMagazine: "", CapacidadWO: "", Troquel: "", Paneles: "", Placas: "", Turno: "", Autor: "", Usuario: "",
    });
    const lines = [
      header.join(","),
      ...flat.map((row) =>
        header.map((h) => `"${String((row as Record<string, unknown>)[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="magazines_${Date.now()}.csv"`,
      },
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(flat);
  XLSX.utils.book_append_sheet(wb, ws, "Magazines");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="magazines_${Date.now()}.xlsx"`,
    },
  });
}
