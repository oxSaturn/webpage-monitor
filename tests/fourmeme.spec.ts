import { test, expect } from '@playwright/test';

import { normalizeOuterHtml } from './utils/htmlSnapshot';

const URL = process.env.TARGET_URL || 'https://four.meme/create-token';

test('Snapshot the whole Launch-your-token form (normalized)', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  // 定位标题
  const heading = page.getByText('Launch your token', { exact: false }).first();
  await expect(heading).toBeVisible({ timeout: 30_000 });

  // 找到最近的 form（如果未来不用 form，再退化成最近容器）
  const form = heading.locator('xpath=ancestor::form[1]');
  if (await form.count()) {
    await expect(form.first()).toBeVisible();
    const html = await form.first().evaluate(el => (el as HTMLElement).outerHTML);
    expect(normalizeOuterHtml(html)).toMatchSnapshot('launch-form.outerHTML.txt');
    return;
  }

  // 退化：找最近“包含输入控件”的容器
  const container = heading.locator('xpath=ancestor-or-self::*[.//input or .//textarea or .//select or .//button][1]');
  await expect(container).toBeVisible();
  const html = await container.evaluate(el => (el as HTMLElement).outerHTML);
  expect(normalizeOuterHtml(html)).toMatchSnapshot('launch-container.outerHTML.txt');
});
test('Snapshot Raised Token dropdown items', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  const heading = page.getByText('Launch your token', { exact: false }).first();
  await expect(heading).toBeVisible({ timeout: 30_000 });

  // Raised Token 触发按钮：从 "Raised Token" 文本往后找一个 button
  const container = heading.locator('xpath=ancestor-or-self::*[.//button][1]');
  const raisedLabel = page.getByText('Raised Token', { exact: false }).first();
  await expect(raisedLabel).toBeVisible();

  const trigger = raisedLabel.locator('xpath=following::button[1]');
  await trigger.click();

  // 常见 dropdown 容器（Radix/HeadlessUI/Ant）
  const dropdown = page.locator(
    '[role="listbox"],[role="menu"],[data-radix-popper-content-wrapper],.ant-select-dropdown,.rc-select-dropdown'
  ).first();

  await expect(dropdown).toBeVisible({ timeout: 10_000 });

  const html = await dropdown.evaluate(el => (el as HTMLElement).outerHTML);
  expect(normalizeOuterHtml(html)).toMatchSnapshot('raised-token-dropdown.outerHTML.txt');
});
