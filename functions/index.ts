// functions/index.ts

interface Env {
  SESSION_DO: DurableObjectNamespace;
  DB: D1Database;
  CART_KV: KVNamespace;
  R2_BUCKET: R2Bucket;
  AI: any;
  FRONTEND_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  JWT_SECRET: string;
}

export class SessionDurableObject {
  state: DurableObjectState;
  sessions: Map<string, any>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.sessions = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop() || "default";

    if (request.method === "GET") {
      const session = await this.state.storage.get(id);
      return new Response(JSON.stringify(session || {}), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method === "POST") {
      const data = await request.json();
      await this.state.storage.put(id, data);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  }
}

// 👇 Export obrigatório do Worker principal
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return new Response("✅ API LeiaSabores Cloudflare está rodando!", {
      headers: { "content-type": "text/plain" },
    });
  },
};