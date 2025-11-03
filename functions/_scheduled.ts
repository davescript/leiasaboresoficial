import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// Cloudflare scheduled worker used to clean carts and sync orders
export const onSchedule: PagesFunction<Env> = async ({ env }) => {
  const url = `${env.SUPABASE_URL}/rest/v1` // lightweight calls via REST
  // Clean carts older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  await fetch(`${url}/carts?status=eq.open&updated_at=lt.${encodeURIComponent(sevenDaysAgo)}`, {
    method: 'PATCH',
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'abandoned' })
  })
}