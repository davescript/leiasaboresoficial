import { test, expect } from '@playwright/test'

const email = process.env.E2E_USER_EMAIL ?? 'test@example.com'
const password = process.env.E2E_USER_PASSWORD ?? '123456'

const fillAddress = async (page: any) => {
  await page.fill('input[placeholder="Nome completo"]', 'Cliente Teste')
  await page.fill('input[placeholder="E-mail"]', 'test@example.com')
  await page.fill('input[placeholder="Telefone"]', '(11) 91234-5678')
  await page.fill('input[placeholder="CEP"]', '01001-000')
  await page.fill('input[placeholder="Rua"]', 'Av Paulista')
  await page.fill('input[placeholder="Número"]', '1000')
  await page.fill('input[placeholder="Complemento"]', 'Ap 10')
  await page.fill('input[placeholder="Bairro"]', 'Bela Vista')
  await page.fill('input[placeholder="Cidade"]', 'São Paulo')
  await page.fill('input[placeholder="Estado"]', 'SP')
}

test('Finaliza pagamento com Stripe', async ({ page }) => {
  await page.goto('/conta')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('text=Entrar')
  await expect(page.locator('text=Minha Conta')).toBeVisible()

  await page.goto('/checkout')
  await expect(page.locator('text=Checkout')).toBeVisible()
  await fillAddress(page)
  await page.click('text=Continuar para pagamento')
  await page.click('text=Ir para pagamento')
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60000 })
})
