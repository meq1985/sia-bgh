import "next-auth";
import "next-auth/jwt";

type AppRole =
  | "ADMIN"
  | "SUPERVISOR"
  | "OPERADOR"
  | "MANTENIMIENTO"
  | "PROGRAMACION";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      username: string;
      role: AppRole;
    };
  }

  interface User {
    id: string;
    username: string;
    role: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: AppRole;
  }
}
