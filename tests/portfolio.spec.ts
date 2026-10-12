import { test, expect, type Page } from '@playwright/test';

const api = 'https://api.github.com/users/Knight-RT/repos?sort=updated&per_page=12';
const repos = [
  { id: 101, name: 'checker-alpha', description: 'Independent fixture description', language: 'JavaScript', stargazers_count: 7, html_url: 'https://github.com/Knight-RT/checker-alpha', private: false, fork: false },
  { id: 102, name: 'checker-missing-fields', description: null, language: null, stargazers_count: 0, html_url: 'https://github.com/Knight-RT/checker-missing-fields', private: false, fork: false },
];

async function mock(page: Page, data: unknown = repos, status = 200) {
  const requests: { url: string; method: string }[] = [];
  await page.route('https://api.github.com/**', async route => {
    requests.push({ url: route.request().url(), method: route.request().method() });
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  });
  return requests;
}
async function open(page: Page) { await mock(page); await page.goto(process.env.BASE_URL!); }

test('R1: required sections occur exactly once', async ({ page }) => {
  await open(page);
  for (const id of ['hero', 'about', 'skills', 'projects', 'repos', 'contact']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  }
});

test('R2: 375px viewport has no horizontal document overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page);
  await expect(page.locator('#repos a[href="' + repos[0].html_url + '"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= window.innerWidth)).toBe(true);
});

test('R3: GitHub and configured or pending contact details', async ({ page }) => {
  await open(page);
  for (const id of ['hero', 'contact']) {
    await expect(page.locator(`#${id} a[href="https://github.com/Knight-RT"]`).first()).toBeVisible();
  }

  const email = process.env.CONTACT_EMAIL ?? 'ryan.tan.0310@gmail.com';
  const linkedin = process.env.LINKEDIN_URL ?? 'https://www.linkedin.com/in/ryan-tan0310/';
  for (const id of ['hero', 'contact']) {
    const contact = page.locator(`#${id}`);
    if (email) {
      await expect(contact.locator(`a[href="mailto:${email}"]`)).toBeVisible();
    } else {
      await expect(contact.getByText('Email coming soon', { exact: true })).toBeVisible();
      await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    }
    if (linkedin) {
      await expect(contact.locator(`a[href="${linkedin}"]`)).toBeVisible();
    } else {
      await expect(contact.getByText('LinkedIn coming soon', { exact: true })).toBeVisible();
      await expect(page.locator('a[href*="linkedin.com"]')).toHaveCount(0);
    }
  }
});

test('R4: successful GET renders complete public repository cards and handles null fields', async ({ page }) => {
  const requests = await mock(page);
  await page.goto(process.env.BASE_URL!);
  const section = page.locator('#repos');
  for (const repo of repos) {
    await expect(section.locator(`a[href="${repo.html_url}"]`).first()).toBeVisible();
    await expect(section.getByText(repo.name, { exact: true })).toBeVisible();
  }
  expect(requests).toContainEqual({ url: api, method: 'GET' });
  await expect(section.getByText(repos[0].description!, { exact: true })).toBeVisible();
  await expect(section.getByText(repos[0].language!, { exact: true })).toBeVisible();
  // Find each card through its public URL, without prescribing its DOM wrapper.
  for (const repo of repos) {
    const cardText = await section.locator(`a[href="${repo.html_url}"]`).first().evaluate((link, name) => {
      let node: HTMLElement | null = link as HTMLElement;
      while (node && node.id !== 'repos') {
        const text = node.innerText || '';
        if (text.includes(name) && /\b\d+\b/.test(text)) return text;
        node = node.parentElement;
      }
      return '';
    }, repo.name);
    expect(cardText).toContain(repo.name);
    expect(cardText).toMatch(new RegExp(`\\b${repo.stargazers_count}\\b`));
    expect(cardText).not.toMatch(/\b(null|undefined)\b/i);
    if (repo.description) expect(cardText).toContain(repo.description);
    if (repo.language) expect(cardText).toContain(repo.language);
  }
});

test('R5: empty response produces a clear empty message', async ({ page }) => {
  await mock(page, []);
  await page.goto(process.env.BASE_URL!);
  await expect(page.locator('#repos').getByText(/no (public )?(repositories|repos)|no repositories (found|available)|repositories .*empty/i)).toBeVisible();
  await expect(page.locator('#repos a[href^="https://github.com/Knight-RT/"]')).toHaveCount(0);
});

test('R6: failed response produces a clear error message', async ({ page }) => {
  await mock(page, { message: 'Fixture service failure' }, 503);
  await page.goto(process.env.BASE_URL!);
  await expect(page.locator('#repos').getByText(/failed|unable|could not|couldn't|error/i)).toBeVisible();
});

test('R7: navigation dark-mode button toggles body.dark', async ({ page }) => {
  await open(page);
  const toggle = page.getByRole('navigation').getByRole('button', { name: 'Toggle dark mode', exact: true });
  await toggle.click();
  await expect(page.locator('body')).toHaveClass(/\bdark\b/);
  await toggle.click();
  await expect(page.locator('body')).not.toHaveClass(/\bdark\b/);
});

test('R8: theme persists in same tab but fresh contexts start light', async ({ page, browser }) => {
  await open(page);
  await expect(page.locator('body')).not.toHaveClass(/\bdark\b/);
  await page.getByRole('button', { name: 'Toggle dark mode', exact: true }).click();
  await page.reload();
  await expect(page.locator('body')).toHaveClass(/\bdark\b/);
  const navigationUrl = new URL(process.env.BASE_URL!);
  navigationUrl.hash = 'about';
  await page.goto(navigationUrl.href);
  await expect(page.locator('body')).toHaveClass(/\bdark\b/);
  const fresh = await browser.newContext();
  try {
    const newPage = await fresh.newPage();
    await mock(newPage);
    await newPage.goto(process.env.BASE_URL!);
    await expect(newPage.locator('body')).not.toHaveClass(/\bdark\b/);
  } finally { await fresh.close(); }
});

test('R9: back-to-top follows the hero visibility threshold and returns to top', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 500 });
  await open(page);
  const button = page.getByRole('button', { name: 'Back to top', exact: true });
  await expect(button).toBeHidden();
  const heroBottom = await page.locator('#hero').evaluate(node => node.getBoundingClientRect().bottom + window.scrollY);
  await page.evaluate(y => window.scrollTo({ top: y - 10, behavior: 'instant' }), heroBottom);
  await expect.poll(() => page.locator('#hero').evaluate(node => node.getBoundingClientRect().bottom)).toBeGreaterThan(0);
  await expect(button).toBeHidden();
  await page.evaluate(y => window.scrollTo({ top: y + 10, behavior: 'instant' }), heroBottom);
  await expect.poll(() => page.locator('#hero').evaluate(node => node.getBoundingClientRect().bottom)).toBeLessThan(0);
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
  await expect(button).toBeHidden();
});


