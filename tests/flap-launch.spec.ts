import { test, expect } from '@playwright/test';

const URL = 'https://flap.sh/launch';

function normalize(html: string) {
  return html
    .replace(/\s+/g, ' ')
    .replace(/([?&]|&amp;)dpl=[^&"']+/g, '$1dpl=<hash>')
    .replace(/\b\d+(\.\d+)?\b/g, '<num>')
    .replace(/[a-f0-9]{32,}/gi, '<hash>')
    .replace(/>\s+</g, '>\n<')
    .replace(/"\s+(?=[^=]+=)/g, '"\n')
    .trim();
}

test('flap.sh – enable tax and snapshot tax settings', async ({ page }) => {
  // 1️⃣ 打开页面
  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  // 2️⃣ 精准命中「表单标题里的 Create Token」
  const h1 = page.locator('h1', { hasText: 'Create Token' });
  await expect(h1).toBeVisible();

  // 3️⃣ 从 h1 往下找到 Tax Settings 的 div（默认隐藏）
  const taxDiv = h1.locator(
    'xpath=following::div[.//text()[normalize-space()="Tax Settings"]][1]'
  );

  // 4️⃣ 点击 Enable Tax 展开模块
  const enableTax = page.locator(
    'button[role="switch"]:has(+ span:text-is("Enable Tax"))'
  );
  await expect(enableTax).toBeVisible();
  await enableTax.scrollIntoViewIfNeeded();
  await enableTax.click();
  await expect(enableTax).toHaveAttribute('data-state', 'checked');

  // 5️⃣ 等前端展开
  await expect(taxDiv).toBeVisible();

  // 6️⃣ 对 Tax Settings 整个 div 打快照
  const html = await taxDiv.evaluate(el => (el as HTMLElement).outerHTML);
  expect(normalize(html)).toMatchSnapshot('flap-tax-settings.after-click.outerHTML.txt');
});
