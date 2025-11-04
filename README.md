# Leia Sabores – Cloudflare Pages + Workers + D1 + KV + R2 + Stripe

Stack atual
- Frontend: React + Vite + Tailwind (Pages)
- Backend: Workers (APIs) com D1 (SQLite), KV (cache/carrinho), R2 (imagens), Durable Objects (sessão), AI (Workers AI)
- Pagamentos: Stripe (Payment Intents + Webhooks)

Como rodar localmente
1. Configure os bindings no `wrangler.toml` (DB, KV, R2, DO, AI e segredos do Stripe)
2. Crie o banco D1 e aplique o schema:
   - `npx wrangler d1 create leiasabores_d1`
   - `npx wrangler d1 execute leiasabores_d1 --file=./d1/schema.sql --local`
3. Inicie o dev: `npm run stripe:dev` (Pages + stripe webhook listener)
4. Acesse `http://localhost:5173` e teste catálogo, carrinho e checkout.

Observações
- O carrinho funciona mesmo sem login via cookie `anon_id` (KV + sincronização com D1).
- Uploads de imagem vão para R2 (`/api/upload`) e são servidos por `/api/assets?key=...`.

Loja de bolos e artigos para festas com stack moderna: Front-end em React 18 + Vite + Tailwind + shadcn/ui (componentes), animações com Framer Motion; backend via Cloudflare Pages Functions/Workers; autenticação e banco no Supabase; pagamentos com Stripe (Payment Intents + Webhooks).

## Stack
- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn-style UI + Framer Motion
- Cloudflare Pages (Front) + Functions (APIs)
- Cloudflare Workers (cron)
- Supabase (PostgreSQL + Auth)
- Stripe (Payment Intents + Webhooks)

## Rotas do Front
- `/` – Home com destaques
- `/produtos` – listagem de produtos
- `/carrinho` – resumo e checkout
- `/conta` – autenticação (email/senha + magic link)
- `/admin` – tabela simples (restrita a `role=admin`)

## Desenvolvimento Local

1. Crie o arquivo `.env` baseado em `.env.example`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
FRONTEND_URL=http://localhost:5173
```

2. Instale dependências e rode o front:
```
npm install
npm run dev
```

3. Rode APIs localmente (Workers):
```
npm run dev:api
```
O `vite` faz proxy de `/api/*` para `localhost:8787`.

## Deploy
- Conecte o repositório ao Cloudflare Pages.
- Build: `npm run build`
- Output: `dist/`
- Configure variáveis no painel (mesmos nomes do `wrangler.toml`).
- Faça deploy dos Workers e cron: `wrangler deploy`.

## Supabase
Crie o projeto no Supabase e execute o SQL:
`supabase/schema.sql`

Tabela `profiles` ligada a `auth.users` com campo `role`. RPC `get_cart_items` retorna itens do carrinho com subtotal.

> Observação: o bloco SQL aqui foi recriado para esta versão (não havia um bloco “versão anterior” disponível). Caso você possua um esquema anterior, substitua por ele.

## Stripe
Crie as chaves e configure os segredos.
Escute webhooks localmente e encaminhe para o Worker:
```
stripe listen --forward-to localhost:8787/api/webhooks/stripe
```

## Testes
- Unit: `npm test`
- E2E: `npm run test:e2e`

## Notas de Compatibilidade
- APIs usam `fetch` nativo do ambiente Cloudflare.
- `@supabase/supabase-js` é compatível com runtimes edge.
- Para webhooks do Stripe no Workers, a verificação é realizada com HMAC via `crypto.subtle`.