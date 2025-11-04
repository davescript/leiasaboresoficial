#!/usr/bin/env bash
set -euo pipefail

echo "[Leia Sabores] Inicialização local (Workers + Vite)"

# 1) Aplicar schema e seed do D1 (local)
echo "\n[1/3] Aplicando schema do D1..."
yes n | npx wrangler d1 execute leiasabores_d1 --local --file d1/schema.sql || true
if [ -f d1/seed.sql ]; then
  echo "[1b] Aplicando seed do D1..."
  yes n | npx wrangler d1 execute leiasabores_d1 --local --file d1/seed.sql || true
fi

# 2) Subir Cloudflare Workers (Pages dev) na porta 8790
echo "\n[2/3] Iniciando Workers em http://localhost:8790..."
(
  npx wrangler pages dev --port 8790 --compatibility-date 2024-01-01
) &

# 3) Subir Vite na porta 8794 com proxy para 8790
echo "\n[3/3] Iniciando Vite em http://localhost:8794..."
npm run dev