import { test, expect } from '@playwright/test'

test('Página inicial carrega produtos e navbar', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Celebre com Sabor e Estilo')).toBeVisible()
  await expect(page.locator('nav')).toBeVisible()
})
