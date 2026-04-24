"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const navByRole: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/magazines", label: "Magazines" },
    { href: "/wo", label: "Work Orders" },
    { href: "/defectivos", label: "Defectuosas" },
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/users", label: "Usuarios" },
    { href: "/admin/work-orders", label: "Gestión WO" },
  ],
  SUPERVISOR: [
    { href: "/magazines", label: "Magazines" },
    { href: "/wo", label: "Work Orders" },
    { href: "/defectivos", label: "Defectuosas" },
  ],
  OPERADOR: [
    { href: "/magazines", label: "Magazines" },
    { href: "/wo", label: "Work Orders" },
    { href: "/defectivos", label: "Defectuosas" },
  ],
};

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role ?? "OPERADOR";
  const nav = navByRole[role] ?? [];

  return (
    <header className="border-b border-bgh-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Image src="/bgh-logo.svg" alt="BGH" width={44} height={44} priority />
          <div className="leading-tight">
            <div className="text-lg font-bold text-bgh-700">SIA</div>
            <div className="text-xs text-bgh-400">Sistema de Inserción Automática</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "rounded-md px-3 py-2 text-sm font-medium transition " +
                  (active
                    ? "bg-bgh-700 text-white"
                    : "text-bgh-700 hover:bg-bgh-50")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          {session?.user && (
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-bgh-800">{session.user.name}</div>
              <div className="text-xs text-bgh-400">{role}</div>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn-secondary"
            title="Cerrar sesión"
          >
            Salir
          </button>
        </div>
      </div>
      <nav className="md:hidden flex overflow-x-auto gap-1 border-t border-bgh-100 px-2 py-2">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium " +
                (active ? "bg-bgh-700 text-white" : "text-bgh-700 bg-bgh-50")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
