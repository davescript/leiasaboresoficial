// src/lib/api.ts
// 🌐 Configuração base da API
export const API_URL =
  import.meta.env.DEV
    ? "" // usa proxy do Vite para /api em desenvolvimento
    : "https://leiasabores.pt"; // Domínio de produção

// 🧩 Utilitários gerais
// Formata valor em euros assumindo que `value` já está em decimais (ex: 12.99)
export const formatCurrency = (value: number) => `€ ${value.toFixed(2)}`;

export const logEvent = (name: string, details?: Record<string, unknown>) => {
  if (import.meta.env.DEV) console.log(`[event] ${name}`, details || {});
};

export const handleError = (error: unknown, context?: string) => {
  const msg = (error as any)?.message || "Erro inesperado";
  if (import.meta.env.DEV) console.error(`[error] ${context || ""}`, error);
  return msg;
};

// Helper para JSON tipado de forma resiliente
async function readJson(res: Response): Promise<any> {
  try { return await res.json() as any } catch { return {} as any }
}

// 🔐 Autenticação
export async function signUp(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Falha ao registrar");
  return readJson(res);
}

export async function signIn(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Credenciais inválidas");
  return readJson(res);
}

export async function signOut() {
  document.cookie = "session=; Path=/; Max-Age=0; SameSite=Lax";
}

export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: 'include',
    mode: 'cors',
  });
  if (!res.ok) return null;
  const data: any = await readJson(res);
  return data?.user || null;
}

// 🛍️ Produtos
export async function getProducts() {
  const res = await fetch(`${API_URL}/api/products`);
  if (!res.ok) throw new Error("Falha ao carregar produtos");
  const data: any = await readJson(res);
  return Array.isArray(data?.products) ? data.products : (Array.isArray(data) ? data : []);
}

export async function getProductById(id: string) {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  if (!res.ok) throw new Error("Produto não encontrado");
  return readJson(res);
}

export async function searchProducts(query: string, category?: string) {
  const params = new URLSearchParams();
  if (query) params.set("search", query);
  if (category) params.set("category", category);

  const res = await fetch(`${API_URL}/api/products?${params.toString()}`);
  if (!res.ok) throw new Error("Falha na busca de produtos");
  const data: any = await readJson(res);
  return Array.isArray(data?.products) ? data.products : [] as any[];
}

// 🛒 Carrinho
export async function getCart(token: string) {
  const res = await fetch(`${API_URL}/api/cart`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    mode: 'cors',
  });
  if (!res.ok) throw new Error("Falha ao obter carrinho");
  return readJson(res);
}

export async function addToCart(token: string, productId: string, quantity = 1) {
  const res = await fetch(`${API_URL}/api/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity }),
    credentials: 'include',
    mode: 'cors',
  });
  if (!res.ok) throw new Error("Falha ao adicionar ao carrinho");
  return readJson(res);
}

export async function removeFromCart(token: string, itemId: string) {
  const res = await fetch(`${API_URL}/api/cart/${itemId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    mode: 'cors',
  });
  if (!res.ok) throw new Error("Falha ao remover do carrinho");
}

export async function updateCartQuantity(
  token: string,
  itemId: string,
  newQty: number
) {
  const res = await fetch(`${API_URL}/api/cart`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ item_id: itemId, quantity: newQty }),
    credentials: 'include',
    mode: 'cors',
  });
  if (!res.ok) throw new Error("Falha ao atualizar quantidade");
  return readJson(res);
}

export function calculateCartTotal(
  items: { quantity: number; product: { price_cents: number } }[]
) {
  return items.reduce(
    (sum, it) => sum + it.quantity * it.product.price_cents,
    0
  );
}

export async function clearCart(token: string) {
  await fetch(`${API_URL}/api/cart`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    mode: 'cors',
  });
}

// 💳 Stripe / Checkout
export async function createCheckoutSession(token: string) {
  const res = await fetch(`${API_URL}/api/checkout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    mode: 'cors',
  });
  if (!res.ok) throw new Error("Falha ao iniciar checkout");
  return readJson(res);
}

export function redirectToCheckout() {
  // Placeholder — checkout é mantido dentro do app com Stripe Elements
}

export async function handleStripeSuccess(event: any) {
  logEvent("stripe_success", event);
}

export async function handleStripeCancel(event: any) {
  logEvent("stripe_cancel", event);
}

export async function verifyStripeSignature(
  _req: Request,
  _sig: string
) {
  // Validação ocorre no Worker (webhook stripe.ts)
}

// 📦 Pedidos
export async function getUserOrders() {
  const res = await fetch(`${API_URL}/api/orders`);
  return res.ok ? readJson(res) : [];
}

export async function getOrderDetails(orderId: string) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}`);
  return res.ok ? readJson(res) : null;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.ok ? readJson(res) : null;
}

// ⚙️ Admin
export async function adminGetAllOrders() {
  const res = await fetch(`${API_URL}/api/orders?all=1`);
  return res.ok ? readJson(res) : [];
}

export async function adminUpdateProductStock(productId: string, qty: number) {
  const res = await fetch(`${API_URL}/api/products`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: productId, stock: qty }),
  });
  return res.ok ? readJson(res) : null;
}

export async function adminDashboardStats() {
  const orders = await adminGetAllOrders();
  const total = orders?.length || 0;
  const paid = orders?.filter((o: any) => o.status === "paid").length || 0;
  return { total_orders: total, paid_orders: paid };
}

export async function adminDashboardStatsSafe() {
  const raw = await adminGetAllOrders();
  const orders: any[] = Array.isArray(raw) ? (raw as any[]) : [];
  const total = orders.length;
  const paid = orders.filter((o) => o && o.status === "paid").length;
  return { total_orders: total, paid_orders: paid };
}