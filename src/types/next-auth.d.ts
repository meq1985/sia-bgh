import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      username: string;
      role: "ADMIN" | "SUPERVISOR" | "OPERADOR";
    };
  }

  interface User {
    id: string;
    username: string;
    role: "ADMIN" | "SUPERVISOR" | "OPERADOR";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: "ADMIN" | "SUPERVISOR" | "OPERADOR";
  }
}
