import { test, expect } from '@playwright/test'

test('Usuário adiciona produto ao carrinho e vai para checkout', async ({ page }) => {
  await page.goto('/produtos')
  await page.click('text=Adicionar ao carrinho')
  await page.click('text=Ver carrinho')
  await expect(page.locator('text=Total')).toBeVisible()
  await page.click('text=Finalizar compra')
})
