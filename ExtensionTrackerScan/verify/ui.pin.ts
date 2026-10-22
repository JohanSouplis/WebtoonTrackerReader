import { expect, Locator, Page, test } from '@playwright/test';

const NOW = new Date('2025-03-10T12:00:00Z');
const LONG_TITLE_START = 'My School Life Pretending To Be a Worthless Person';
const FULL_LONG_TITLE = Array(5).fill(LONG_TITLE_START).join(' - ');

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
  await page.clock.setFixedTime(NOW);
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

function library(page: Page): Locator {
  return page.getByRole('list', { name: 'Library' });
}

function row(page: Page, title: string): Locator {
  return library(page)
    .getByRole('listitem')
    .filter({ has: page.getByRole('link', { name: title, exact: true }) });
}

function sortButton(page: Page, label: string): Locator {
  return page
    .getByRole('group', { name: 'Sort by' })
    .getByRole('button', { name: new RegExp(`^${label}`) });
}

async function expectSortedBy(page: Page, name: string) {
  await expect(
    page
      .getByRole('group', { name: 'Sort by' })
      .getByRole('button', { name, exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
}

async function expectShownTitles(page: Page, titles: string[]) {
  await expect(library(page).getByRole('link')).toHaveText(titles);
}

async function openLibrary(page: Page) {
  await page.goto('/');
  await expect(library(page).getByRole('listitem')).toHaveCount(10);
  await expectSortedBy(page, 'Last read (descending)');
}

async function setPageSize(page: Page, size: string) {
  await page.getByRole('combobox', { name: 'Rows' }).click();
  await page.getByRole('option', { name: size, exact: true }).click();
}

async function showAllRows(page: Page) {
  await setPageSize(page, '50');
  await expect(library(page).getByRole('listitem')).toHaveCount(20);
}

async function searchTitle(page: Page, text: string) {
  await page
    .getByRole('searchbox', { name: 'Filter by title' })
    .pressSequentially(text);
}

function toggle(page: Page, name: string): Locator {
  return page.getByRole('button', { name, exact: true });
}

async function goToAddWebsite(page: Page) {
  await page.getByRole('button', { name: 'Add website' }).click();
  await expect(
    page.getByRole('heading', { name: 'Propose a website' }),
  ).toBeVisible();
}

test.describe('navbar', () => {
  test('navbar switches between library and add website', async ({ page }) => {
    await openLibrary(page);
    await expect(page.getByRole('button', { name: 'Library' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await pin(page, 'nav-01-library-selected');
    await goToAddWebsite(page);
    await expect(page).toHaveURL(/\/add_website_pattern$/);
    await expect(
      page.getByRole('button', { name: 'Add website' }),
    ).toHaveAttribute('aria-current', 'page');
    await pin(page, 'nav-02-add-website-selected');
    await page.getByRole('button', { name: 'Library' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expectSortedBy(page, 'Last read (descending)');
    await pin(page, 'nav-03-back-to-library');
  });

  test('navbar informations opens full page through the navigator port', async ({
    page,
  }) => {
    await openLibrary(page);
    await page.getByRole('button', { name: 'Informations' }).click();
    await expect
      .poll(() => events.some((e) => e.includes('open page mocked')))
      .toBe(true);
    await pin(page, 'nav-04-after-informations');
  });

  test('deep link to add website route highlights its tab', async ({
    page,
  }) => {
    await page.goto('/add_website_pattern');
    await expect(
      page.getByRole('heading', { name: 'Propose a website' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add website' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      page.getByRole('button', { name: 'Library' }),
    ).not.toHaveAttribute('aria-current');
    await pin(page, 'nav-05-deep-link-add-website');
  });
});

test.describe('scan list', () => {
  test('initial list and pagination', async ({ page }) => {
    await openLibrary(page);
    await expect(page.getByText('20 series')).toBeVisible();
    await pin(page, 'scan-01-initial');
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('11–20 of 20')).toBeVisible();
    await pin(page, 'scan-02-page-2');
    await page.getByRole('button', { name: 'Previous page' }).click();
    await setPageSize(page, '5');
    await expect(library(page).getByRole('listitem')).toHaveCount(5);
    await pin(page, 'scan-03-page-size-5');
    await page.getByRole('button', { name: 'Last page' }).click();
    await expect(page.getByText('16–20 of 20')).toBeVisible();
    await pin(page, 'scan-04-page-size-5-last');
    await page.getByRole('button', { name: 'First page' }).click();
    await showAllRows(page);
    await pin(page, 'scan-05-page-size-50');
  });

  test('sorting by each key', async ({ page }) => {
    await openLibrary(page);
    await showAllRows(page);
    await sortButton(page, 'Last read').click();
    await expectSortedBy(page, 'Last read (ascending)');
    await pin(page, 'scan-sort-01-last-read-toggled');
    await sortButton(page, 'Title').click();
    await expectSortedBy(page, 'Title (ascending)');
    await pin(page, 'scan-sort-02-title-first-click');
    await sortButton(page, 'Title').click();
    await expectSortedBy(page, 'Title (descending)');
    await pin(page, 'scan-sort-03-title-second-click');
    await sortButton(page, 'Chapter').click();
    await expectSortedBy(page, 'Chapter (descending)');
    await pin(page, 'scan-sort-04-chapter-first-click');
    await sortButton(page, 'Chapter').click();
    await expectSortedBy(page, 'Chapter (ascending)');
    await pin(page, 'scan-sort-05-chapter-second-click');
    await sortButton(page, 'Favorite').click();
    await expectSortedBy(page, 'Favorite (descending)');
    await pin(page, 'scan-sort-06-favorite-first-click');
    await sortButton(page, 'Rating').click();
    await expectSortedBy(page, 'Rating (descending)');
    await pin(page, 'scan-sort-07-rating-first-click');
    await sortButton(page, 'Rating').click();
    await expectSortedBy(page, 'Rating (ascending)');
    await pin(page, 'scan-sort-08-rating-second-click');
  });

  test('title filter matches titles only', async ({ page }) => {
    await openLibrary(page);
    await searchTitle(page, 'sss');
    await expectShownTitles(page, [
      'Return of the SSS-Class Ranker',
      'SSS-Class Suicide Hunter',
    ]);
    await pin(page, 'scan-filter-01-title-sss');
    await page.getByRole('button', { name: 'Clear Filter by title' }).click();
    await searchTitle(page, 'asura');
    await expect(
      page.getByText('Nothing in your library for “asura”.'),
    ).toBeVisible();
    await pin(page, 'scan-filter-02-website-is-not-a-title');
  });

  test('empty state clears the filters', async ({ page }) => {
    await openLibrary(page);
    await searchTitle(page, 'zzzz');
    await toggle(page, 'Favorites only').click();
    await expect(
      page.getByRole('heading', { name: 'No reads match' }),
    ).toBeVisible();
    await expect(page.getByText('0 series')).toBeVisible();
    await pin(page, 'scan-empty-01-no-match');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(library(page).getByRole('listitem')).toHaveCount(10);
    await expect(
      page.getByRole('searchbox', { name: 'Filter by title' }),
    ).toHaveValue('');
    await expect(toggle(page, 'Favorites only')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await pin(page, 'scan-empty-02-cleared');
  });

  test('favorites, rated and title filters compose', async ({ page }) => {
    await openLibrary(page);
    await toggle(page, 'Favorites only').click();
    await expect(page.getByText('11 series')).toBeVisible();
    await pin(page, 'scan-check-01-favorites-only');
    await toggle(page, 'Rated only').click();
    await expect(page.getByText('7 series')).toBeVisible();
    await pin(page, 'scan-check-02-favorites-and-rated');
    await searchTitle(page, 'heavenly');
    await expectShownTitles(page, ['The Heavenly Demon Wants a Quiet Life']);
    await pin(page, 'scan-check-03-favorites-rated-and-title');
    await toggle(page, 'Favorites only').click();
    await expectShownTitles(page, [
      'The Heavenly Demon Wants a Quiet Life',
      "The Heavenly Demon Can't Live a Normal Life",
    ]);
    await pin(page, 'scan-check-04-rated-and-title');
    await toggle(page, 'Rated only').click();
    await page.getByRole('button', { name: 'Clear Filter by title' }).click();
    await expect(page.getByText('20 series')).toBeVisible();
    await pin(page, 'scan-check-05-none');
  });

  test('toggle favorite on a row re-applies favorites only', async ({
    page,
  }) => {
    await openLibrary(page);
    const star = row(page, 'Worthless Regression').getByRole('button', {
      name: 'Favorite Worthless Regression',
    });
    await star.click();
    await expect(star).toHaveAttribute('aria-pressed', 'true');
    await pin(page, 'scan-fav-01-worthless-regression-favorited');
    await toggle(page, 'Favorites only').click();
    await expect(row(page, 'Worthless Regression')).toHaveCount(1);
    await pin(page, 'scan-fav-02-favorites-only-includes-it');
    await row(page, 'Worthless Regression')
      .getByRole('button', { name: 'Favorite Worthless Regression' })
      .click();
    await expect(row(page, 'Worthless Regression')).toHaveCount(0);
    await expect(page.getByText('11 series')).toBeVisible();
    await pin(page, 'scan-fav-03-unfavorited-leaves-favorites-only');
    await expect
      .poll(() => events.filter((e) => e.includes('scan is updated')).length)
      .toBe(2);
  });

  test('change rating on a row', async ({ page }) => {
    await openLibrary(page);
    await row(page, 'Duke Pendragon')
      .getByRole('combobox', { name: 'Rating for Duke Pendragon' })
      .click();
    await pin(page, 'scan-rating-01-select-open');
    await page.getByRole('option', { name: '3', exact: true }).click();
    await expect(row(page, 'Duke Pendragon').getByRole('combobox')).toHaveText(
      '3',
    );
    await pin(page, 'scan-rating-02-duke-pendragon-rated-3');
    await toggle(page, 'Rated only').click();
    await expect(row(page, 'Duke Pendragon')).toHaveCount(1);
    await pin(page, 'scan-rating-03-rated-only-includes-it');
  });

  test('delete a row', async ({ page }) => {
    await openLibrary(page);
    await row(page, 'Local').hover();
    await pin(page, 'scan-delete-01-revealed-on-hover');
    await row(page, 'Local')
      .getByRole('button', { name: 'Delete Local' })
      .click();
    await expect(row(page, 'Local')).toHaveCount(0);
    await expect(page.getByText('19 series')).toBeVisible();
    await pin(page, 'scan-delete-02-local-removed');
  });

  test('delete is reachable from the keyboard', async ({ page }) => {
    await openLibrary(page);
    await row(page, 'Local')
      .getByRole('button', { name: 'Favorite Local' })
      .focus();
    await page.keyboard.press('Tab');
    const remove = row(page, 'Local').getByRole('button', {
      name: 'Delete Local',
    });
    await expect(remove).toBeFocused();
    await expect(remove).toHaveCSS('opacity', '1');
    await pin(page, 'scan-delete-03-revealed-on-focus');
  });

  test('delete keeps the title filter', async ({ page }) => {
    await openLibrary(page);
    await searchTitle(page, 'sss');
    await row(page, 'SSS-Class Suicide Hunter')
      .getByRole('button', { name: 'Delete SSS-Class Suicide Hunter' })
      .click();
    await expectShownTitles(page, ['Return of the SSS-Class Ranker']);
    await expect(
      page.getByRole('searchbox', { name: 'Filter by title' }),
    ).toHaveValue('sss');
    await pin(page, 'scan-delete-04-with-title-filter');
  });

  test('delete keeps favorites only', async ({ page }) => {
    await openLibrary(page);
    await toggle(page, 'Favorites only').click();
    await row(page, 'Local')
      .getByRole('button', { name: 'Delete Local' })
      .click();
    await expect(row(page, 'Local')).toHaveCount(0);
    await expect(page.getByText('10 series')).toBeVisible();
    await expect(toggle(page, 'Favorites only')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await pin(page, 'scan-delete-05-with-favorites-only');
  });

  test('delete keeps the title sort', async ({ page }) => {
    await openLibrary(page);
    await sortButton(page, 'Title').click();
    await row(page, 'Local')
      .getByRole('button', { name: 'Delete Local' })
      .click();
    await expect(row(page, 'Local')).toHaveCount(0);
    await expectSortedBy(page, 'Title (ascending)');
    await expect(library(page).getByRole('link').first()).toHaveText(
      "A Dragonslayer's Peerless Regression",
    );
    await pin(page, 'scan-delete-06-after-title-sort');
  });

  test('long title is truncated with tooltip', async ({ page }) => {
    await openLibrary(page);
    await showAllRows(page);
    const title = library(page).getByText(LONG_TITLE_START);
    await expect(title).toHaveText(/\.\.\.$/);
    await title.hover();
    await expect(
      page
        .getByText(FULL_LONG_TITLE, { exact: true })
        .filter({ visible: true }),
    ).toBeVisible();
    await pin(page, 'scan-title-01-long-title-tooltip');
  });

  test('relative read date shows the exact date in a tooltip', async ({
    page,
  }) => {
    await openLibrary(page);
    await row(page, 'Local').getByText('1 mo ago').hover();
    await expect(
      page.getByText('24/01/2025', { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await pin(page, 'scan-date-01-exact-date-tooltip');
  });

  test('clicking a title opens its url in a new tab', async ({ page }) => {
    await openLibrary(page);
    const popup = page.waitForEvent('popup');
    await page
      .getByRole('link', { name: 'Solo Leveling: Ragnarok', exact: true })
      .click();
    const tab = await popup;
    await tab.waitForLoadState();
    events.push(`popup: ${tab.url()}`);
    await tab.close();
    await pin(page, 'scan-title-02-after-open');
  });
});

test.describe('add website', () => {
  test('propose a website', async ({ page }) => {
    await openLibrary(page);
    await goToAddWebsite(page);
    const propose = page.getByRole('button', { name: 'Propose' });
    await expect(propose).toBeDisabled();
    await pin(page, 'add-01-initial');
    await page
      .getByRole('textbox', { name: 'Website name' })
      .fill('example-scans.com');
    await expect(propose).toBeEnabled();
    await pin(page, 'add-02-filled');
    await propose.click();
    await expect(page.getByText('Website proposed. Thanks!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sent' })).toBeDisabled();
    await pin(page, 'add-03-success');
    await expect(page.getByText('Website proposed. Thanks!')).toBeHidden({
      timeout: 7000,
    });
    await expect(propose).toBeDisabled();
    await pin(page, 'add-04-success-dismissed');
  });

  test('supported websites filter and pagination', async ({ page }) => {
    await openLibrary(page);
    await goToAddWebsite(page);
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('11–14 of 14')).toBeVisible();
    await pin(page, 'add-list-01-page-2');
    await page.getByRole('button', { name: 'First page' }).click();
    await page.getByRole('button', { name: 'Last page' }).click();
    await expect(page.getByText('11–14 of 14')).toBeVisible();
    await pin(page, 'add-list-02-last-page');
    await page.getByRole('button', { name: 'First page' }).click();
    await page
      .getByRole('searchbox', { name: 'Filter by website' })
      .pressSequentially('manga');
    await pin(page, 'add-list-03-filter-manga');
    await page.getByRole('searchbox', { name: 'Filter by website' }).fill('');
    await page
      .getByRole('searchbox', { name: 'Filter by website' })
      .pressSequentially('nothing-here');
    await expect(
      page.getByText('No supported website matches “nothing-here”.'),
    ).toBeVisible();
    await pin(page, 'add-list-04-filter-no-match');
  });
});
