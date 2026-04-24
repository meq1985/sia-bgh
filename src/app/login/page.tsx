"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      username: username.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (!res || res.error) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/bgh-logo.svg" alt="BGH" width={90} height={90} priority />
          <h1 className="mt-3 text-2xl font-bold text-bgh-700">SIA</h1>
          <p className="text-sm text-bgh-400">Sistema de Inserción Automática</p>
        </div>
        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label htmlFor="username" className="label-base">Usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-base"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="label-base">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
            />
          </div>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <p className="text-center text-xs text-bgh-400">
            La sesión queda activa hasta que cierres sesión manualmente.
          </p>
        </form>
      </div>
    </div>
  );
}
