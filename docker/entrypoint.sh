#!/bin/sh
set -e

echo "[entrypoint] Esperando a Postgres..."
until node -e "const net=require('net');const s=new net.Socket();s.connect(5432,'db',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1));" 2>/dev/null; do
  echo "[entrypoint] DB no lista, reintento en 2s..."
  sleep 2
done

echo "[entrypoint] Sincronizando schema (prisma db push)..."
npx prisma db push --skip-generate --accept-data-loss

echo "[entrypoint] Ejecutando seed..."
npx tsx prisma/seed.ts || echo "[entrypoint] seed falló o ya aplicado, continuo"

echo "[entrypoint] Iniciando app..."
exec npm run start
