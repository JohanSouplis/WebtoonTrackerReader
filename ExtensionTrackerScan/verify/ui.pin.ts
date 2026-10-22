import { expect, Locator, Page, test } from '@playwright/test';

const LONG_TITLE = /^\s*My School Life Pretending To Be a Worthless Person/;
const FULL_LONG_TITLE = Array(5)
  .fill('My School Life Pretending To Be a Worthless Person')
  .join(' - ');

let events: string[] = [];

test.beforeEach(async ({ page, context }) => {
  events = [];
  await context.route(
    (url) => url.hostname !== '127.0.0.1',
    (route) =>
      route.fulfill({
        status: 200,
        contentType:
          route.request().resourceType() === 'stylesheet'
            ? 'text/css'
            : 'text/html',
        body: '',
      }),
  );
  page.on('console', (m) => events.push(`console.${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => events.push(`pageerror: ${e.message}`));
});

test.afterEach(async ({}, testInfo) => {
  const name = testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  expect.soft(events.join('\n') + '\n').toMatchSnapshot(`${name}.events.txt`);
});

async function pin(page: Page, name: string) {
  await expect.soft(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  expect
    .soft((await page.locator('body').ariaSnapshot()) + '\n')
    .toMatchSnapshot(`${name}.aria.txt`);
}

async function openScanList(page: Page) {
  await page.goto('/');
  await expect(
    page.getByRole('columnheader', { name: 'Was read' }),
  ).toHaveAttribute('aria-sort', 'descending');
}

async function setPageSize(page: Page, size: string) {
  await page
    .getByRole('combobox', { name: /Items per page/ })
    .click({ force: true });
  await page.getByRole('option', { name: size, exact: true }).click();
}

async function showAllRows(page: Page) {
  await setPageSize(page, '50');
  await expect(page.getByRole('row')).toHaveCount(21);
}

function row(page: Page, title: string | RegExp): Locator {
  return page
    .getByRole('row')
    .filter({ has: page.getByText(title, { exact: true }) });
}

async function typeFilter(page: Page, label: string, text: string) {
  await page.getByRole('textbox', { name: label }).pressSequentially(text);
}

async function goToAddWebsite(page: Page) {
  await page.getByText('Add Website', { exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Propose a new website for the next update',
    }),
  ).toBeVisible();
}

test.describe('navbar', () => {
  test('navbar switches between scan list and add website', async ({
    page,
  }) => {
    await openScanList(page);
    await pin(page, 'nav-01-scan-list-selected');
    await goToAddWebsite(page);
    await expect(page).toHaveURL(/\/add_website_pattern$/);
    await pin(page, 'nav-02-add-website-selected');
    await page.getByText('Scan list', { exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('columnheader', { name: 'Was read' }),
    ).toHaveAttribute('aria-sort', 'descending');
    await pin(page, 'nav-03-back-to-scan-list');
  });

  test('navbar informations opens full page through the navigator port', async ({
    page,
  }) => {
    await openScanList(page);
    await page.getByText('Informations', { exact: true }).click();
    await expect
      .poll(() => events.some((e) => e.includes('open page mocked')))
      .toBe(true);
    await pin(page, 'nav-04-after-informations');
  });

  test('deep link to add website route', async ({ page }) => {
    await page.goto('/add_website_pattern');
    await expect(
      page.getByRole('heading', {
        name: 'Propose a new website for the next update',
      }),
    ).toBeVisible();
    await pin(page, 'nav-05-deep-link-add-website');
  });
});

test.describe('scan list', () => {
  test('initial list and pagination', async ({ page }) => {
    await openScanList(page);
    await pin(page, 'scan-01-initial');
    await page.getByRole('button', { name: 'Next page' }).click();
    await pin(page, 'scan-02-page-2');
    await page.getByRole('button', { name: 'Previous page' }).click();
    await setPageSize(page, '5');
    await pin(page, 'scan-03-page-size-5');
    await page.getByRole('button', { name: 'Last page' }).click();
    await pin(page, 'scan-04-page-size-5-last');
    await page.getByRole('button', { name: 'First page' }).click();
    await showAllRows(page);
    await pin(page, 'scan-05-page-size-50');
  });

  test('sorting by each column', async ({ page }) => {
    await openScanList(page);
    await showAllRows(page);
    const header = (name: string) => page.getByRole('columnheader', { name });
    await header('Was read').click();
    await pin(page, 'scan-sort-01-was-read-toggled');
    await header('Title').click();
    await pin(page, 'scan-sort-02-title-first-click');
    await header('Title').click();
    await pin(page, 'scan-sort-03-title-second-click');
    await header('Chapter').click();
    await pin(page, 'scan-sort-04-chapter-first-click');
    await header('Chapter').click();
    await pin(page, 'scan-sort-05-chapter-second-click');
    await header('Fav').click();
    await pin(page, 'scan-sort-06-fav-first-click');
    await header('Rating').click();
    await pin(page, 'scan-sort-07-rating-first-click');
    await header('Rating').click();
    await pin(page, 'scan-sort-08-rating-second-click');
  });

  test('title filter', async ({ page }) => {
    await openScanList(page);
    await typeFilter(page, 'Filter by title', 'sss');
    await pin(page, 'scan-filter-01-title-sss');
    await page.getByRole('textbox', { name: 'Filter by title' }).fill('');
    await typeFilter(page, 'Filter by title', 'zzzz');
    await pin(page, 'scan-filter-02-title-no-match');
  });

  test('favorites and rating checkboxes', async ({ page }) => {
    await openScanList(page);
    await page.getByRole('checkbox', { name: 'Favorites Only' }).click();
    await pin(page, 'scan-check-01-favorites-only');
    await page.getByRole('checkbox', { name: 'Rating Only' }).click();
    await pin(page, 'scan-check-02-favorites-and-rating');
    await page.getByRole('checkbox', { name: 'Favorites Only' }).click();
    await pin(page, 'scan-check-03-rating-only');
    await page.getByRole('checkbox', { name: 'Rating Only' }).click();
    await pin(page, 'scan-check-04-none');
  });

  test('toggle favorite on a row', async ({ page }) => {
    await openScanList(page);
    await row(page, 'Worthless Regression')
      .getByRole('img', { name: 'Not Favorited' })
      .click();
    await expect(
      row(page, 'Worthless Regression').getByRole('img', {
        name: 'Favorited',
        exact: true,
      }),
    ).toBeVisible();
    await pin(page, 'scan-fav-01-worthless-regression-favorited');
    await page.getByRole('checkbox', { name: 'Favorites Only' }).click();
    await pin(page, 'scan-fav-02-favorites-only-includes-it');
    await row(page, 'Worthless Regression')
      .getByRole('img', { name: 'Favorited', exact: true })
      .click();
    await pin(page, 'scan-fav-03-unfavorited-while-filtered');
    await expect
      .poll(() => events.filter((e) => e.includes('scan is updated')).length)
      .toBe(2);
  });

  test('change rating on a row', async ({ page }) => {
    await openScanList(page);
    await row(page, 'Duke Pendragon').getByRole('combobox').click();
    await pin(page, 'scan-rating-01-select-open');
    await page.getByRole('option', { name: '3', exact: true }).click();
    await expect(row(page, 'Duke Pendragon').getByRole('combobox')).toHaveText(
      '3',
    );
    await pin(page, 'scan-rating-02-duke-pendragon-rated-3');
    await page.getByRole('checkbox', { name: 'Rating Only' }).click();
    await pin(page, 'scan-rating-03-rating-only-includes-it');
  });

  test('delete a row', async ({ page }) => {
    await openScanList(page);
    await row(page, 'Local')
      .getByRole('img', { name: 'assets/delete.png' })
      .click();
    await expect(row(page, 'Local')).toHaveCount(0);
    await pin(page, 'scan-delete-01-local-removed');
  });

  test('delete while title filter is active', async ({ page }) => {
    await openScanList(page);
    await typeFilter(page, 'Filter by title', 'sss');
    await row(page, 'SSS-Class Suicide Hunter')
      .getByRole('img', { name: 'assets/delete.png' })
      .click();
    await expect(row(page, 'SSS-Class Suicide Hunter')).toHaveCount(0);
    await pin(page, 'scan-delete-02-with-title-filter');
  });

  test('delete while favorites only is active', async ({ page }) => {
    await openScanList(page);
    await page.getByRole('checkbox', { name: 'Favorites Only' }).click();
    await row(page, 'Local')
      .getByRole('img', { name: 'assets/delete.png' })
      .click();
    await expect(row(page, 'Local')).toHaveCount(0);
    await pin(page, 'scan-delete-03-with-favorites-only');
  });

  test('delete after sorting by title', async ({ page }) => {
    await openScanList(page);
    await page.getByRole('columnheader', { name: 'Title' }).click();
    await row(page, 'Local')
      .getByRole('img', { name: 'assets/delete.png' })
      .click();
    await expect(row(page, 'Local')).toHaveCount(0);
    await pin(page, 'scan-delete-04-after-title-sort');
  });

  test('long title is truncated with tooltip', async ({ page }) => {
    await openScanList(page);
    await showAllRows(page);
    const link = page.getByRole('table').getByText(LONG_TITLE);
    await expect(link).toHaveText(/\.\.\.\s*$/);
    await link.hover();
    const fullTitle = page.getByText(FULL_LONG_TITLE, { exact: true });
    await expect
      .poll(async () => {
        const boxes = await Promise.all(
          (await fullTitle.all()).map((l) => l.boundingBox()),
        );
        return boxes.some((b) => b !== null && b.width > 50);
      })
      .toBe(true);
    await pin(page, 'scan-title-01-long-title-tooltip');
  });

  test('clicking a title opens its url in a new tab', async ({ page }) => {
    await openScanList(page);
    const popup = page.waitForEvent('popup');
    await page.getByText('Solo Leveling: Ragnarok', { exact: true }).click();
    const tab = await popup;
    await tab.waitForLoadState();
    events.push(`popup: ${tab.url()}`);
    await tab.close();
    await pin(page, 'scan-title-02-after-open');
  });
});

test.describe('add website', () => {
  test('propose a website', async ({ page }) => {
    await openScanList(page);
    await goToAddWebsite(page);
    const ask = page.getByRole('button', { name: 'Ask' });
    await expect(ask).toBeDisabled();
    await pin(page, 'add-01-initial');
    await page
      .getByRole('textbox', { name: 'Enter website name' })
      .fill('example-scans.com');
    await expect(ask).toBeEnabled();
    await pin(page, 'add-02-filled');
    await ask.click();
    await expect(
      page.getByText('The website has been proposed successfully'),
    ).toBeVisible();
    await expect(ask).toBeDisabled();
    await pin(page, 'add-03-success');
    await expect(
      page.getByText('The website has been proposed successfully'),
    ).toBeHidden({ timeout: 6000 });
    await pin(page, 'add-04-success-dismissed');
  });

  test('available websites filter and pagination', async ({ page }) => {
    await openScanList(page);
    await goToAddWebsite(page);
    await page.getByRole('button', { name: 'Next page' }).click();
    await pin(page, 'add-list-01-page-2');
    await page.getByRole('button', { name: 'Last page' }).click();
    await pin(page, 'add-list-02-last-page');
    await page.getByRole('button', { name: 'First page' }).click();
    await typeFilter(page, 'Filter by website', 'manga');
    await pin(page, 'add-list-03-filter-manga');
    await page.getByRole('textbox', { name: 'Filter by website' }).fill('');
    await typeFilter(page, 'Filter by website', 'nothing-here');
    await pin(page, 'add-list-04-filter-no-match');
  });
});
