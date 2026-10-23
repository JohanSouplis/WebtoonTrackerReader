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

function titleLinks(page: Page): Locator {
  return library(page)
    .getByRole('link')
    .filter({ hasNotText: /^New · Ch\./ });
}

async function expectShownTitles(page: Page, titles: string[]) {
  await expect(titleLinks(page)).toHaveText(titles);
}

function settingsButton(page: Page): Locator {
  return page.getByRole('button', { name: /^New chapter checks/ });
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
  const field = page.getByRole('searchbox', { name: 'Filter by title' });
  await field.pressSequentially(text);
  await expect(field).toHaveValue(text);
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
    await expect(page).toHaveURL(/#\/add_website_pattern$/);
    await expect(
      page.getByRole('button', { name: 'Add website' }),
    ).toHaveAttribute('aria-current', 'page');
    await pin(page, 'nav-02-add-website-selected');
    await page.getByRole('button', { name: 'Library' }).click();
    await expect(page).toHaveURL(/#\/$/);
    await expectSortedBy(page, 'Last read (descending)');
    await pin(page, 'nav-03-back-to-library');
  });

  test('about explains tracking and turns parse reports off', async ({
    page,
  }) => {
    await openLibrary(page);
    await page.getByRole('button', { name: 'About' }).click();
    await expect(page).toHaveURL(/#\/about$/);
    await expect(page.getByRole('button', { name: 'About' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(
      page.getByRole('heading', { name: 'What gets tracked' }),
    ).toBeVisible();
    await pin(page, 'nav-04-about');
    const reports = page.getByRole('switch', {
      name: 'Send anonymous parse reports',
    });
    await expect(reports).toBeChecked();
    await reports.click();
    await expect(reports).not.toBeChecked();
    await page.getByText('Scan Tracker · version').scrollIntoViewIfNeeded();
    await pin(page, 'nav-05-about-reports-off');
  });

  test('deep link to add website route highlights its tab', async ({
    page,
  }) => {
    await page.goto('/#/add_website_pattern');
    await expect(
      page.getByRole('heading', { name: 'Propose a website' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add website' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      page.getByRole('button', { name: 'Library' }),
    ).not.toHaveAttribute('aria-current');
    await pin(page, 'nav-06-deep-link-add-website');
  });
});

test.describe('popup size', () => {
  test('the library fits the popup with its pagination in view', async ({
    page,
  }) => {
    await openLibrary(page);
    const paginator = await page.locator('mat-paginator').boundingBox();
    expect(paginator && paginator.y + paginator.height).toBeLessThanOrEqual(
      600,
    );
    await library(page).getByRole('listitem').last().scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('searchbox', { name: 'Filter by title' }),
    ).toBeInViewport();
    await pin(page, 'popup-01-scrolled-list-keeps-header-and-pagination');
  });

  test('a narrow popup reflows without scrolling sideways', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 400, height: 600 });
    await openLibrary(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(400);
    await pin(page, 'popup-02-narrow-library');
    await goToAddWebsite(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(400);
    await pin(page, 'popup-03-narrow-add-website');
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
    await sortButton(page, 'Following').click();
    await expectSortedBy(page, 'Following (descending)');
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
    await toggle(page, 'Following only').click();
    await expect(
      page.getByRole('heading', { name: 'No reads match' }),
    ).toBeVisible();
    await expect(page.getByText('0 series')).toBeVisible();
    await expect(
      page.getByText('Nothing in your library for “zzzz”.'),
    ).toBeVisible();
    await pin(page, 'scan-empty-01-no-match');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(library(page).getByRole('listitem')).toHaveCount(10);
    await expect(
      page.getByRole('searchbox', { name: 'Filter by title' }),
    ).toHaveValue('');
    await expect(toggle(page, 'Following only')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await pin(page, 'scan-empty-02-cleared');
  });

  test('favorites, rated and title filters compose', async ({ page }) => {
    await openLibrary(page);
    await toggle(page, 'Following only').click();
    await expect(page.getByText('11 series')).toBeVisible();
    await pin(page, 'scan-check-01-favorites-only');
    await toggle(page, 'Rated only').click();
    await expect(page.getByText('7 series')).toBeVisible();
    await pin(page, 'scan-check-02-favorites-and-rated');
    await searchTitle(page, 'heavenly');
    await expectShownTitles(page, ['The Heavenly Demon Wants a Quiet Life']);
    await pin(page, 'scan-check-03-favorites-rated-and-title');
    await toggle(page, 'Following only').click();
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
      name: 'Follow Worthless Regression',
    });
    await star.click();
    await expect(star).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByText(
        "Following “Worthless Regression”. We'll check for new chapters.",
      ),
    ).toBeVisible();
    await pin(page, 'scan-fav-01-worthless-regression-favorited');
    await toggle(page, 'Following only').click();
    await expect(row(page, 'Worthless Regression')).toHaveCount(1);
    await pin(page, 'scan-fav-02-favorites-only-includes-it');
    await row(page, 'Worthless Regression')
      .getByRole('button', { name: 'Follow Worthless Regression' })
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

  test('undo brings a deleted row back', async ({ page }) => {
    await openLibrary(page);
    await row(page, 'Local')
      .getByRole('button', { name: 'Delete Local' })
      .click();
    await expect(row(page, 'Local')).toHaveCount(0);
    await expect(page.getByText('Removed “Local”')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Omniscient Reader’s Viewpoint' }),
    ).toBeFocused();
    await pin(page, 'scan-delete-07-undo-offered');
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(row(page, 'Local')).toHaveCount(1);
    await expect(page.getByText('20 series')).toBeVisible();
    await expect(
      row(page, 'Local').getByRole('button', { name: 'Follow Local' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await pin(page, 'scan-delete-08-undone');
  });

  test('double click on delete removes a single row', async ({ page }) => {
    await openLibrary(page);
    await row(page, 'Local')
      .getByRole('button', { name: 'Delete Local' })
      .dblclick();
    await expect(row(page, 'Local')).toHaveCount(0);
    await expect(page.getByText('19 series')).toBeVisible();
    await expect(row(page, 'Omniscient Reader’s Viewpoint')).toHaveCount(1);
  });

  test('delete is reachable from the keyboard', async ({ page }) => {
    await openLibrary(page);
    await row(page, 'Local')
      .getByRole('button', { name: 'Follow Local' })
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
    await toggle(page, 'Following only').click();
    await row(page, 'Local')
      .getByRole('button', { name: 'Delete Local' })
      .click();
    await expect(row(page, 'Local')).toHaveCount(0);
    await expect(page.getByText('10 series')).toBeVisible();
    await expect(toggle(page, 'Following only')).toHaveAttribute(
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
    await expect(titleLinks(page).first()).toHaveText(
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

test.describe('new chapters', () => {
  test('favorites show their new chapter and sort first', async ({ page }) => {
    await openLibrary(page);
    await expect(
      row(page, 'The Executioner').getByRole('link', { name: 'New · Ch. 47' }),
    ).toHaveAttribute(
      'href',
      'https://asuracomic.net/series/the-executioner-472e692a/chapter/47',
    );
    await expect(row(page, 'Dungeon Odyssey')).toContainText('New · Ch. 119.5');
    await expect(row(page, 'Duke Pendragon')).toContainText(
      "Can't check this site",
    );
    await expect(row(page, 'I Obtained a Mythic Item')).not.toContainText(
      'New',
    );
    await pin(page, 'new-01-chips');
    await sortButton(page, 'New').click();
    await expectSortedBy(page, 'New (descending)');
    await expect(titleLinks(page).first()).toHaveText('The Executioner');
    await expect(titleLinks(page).nth(1)).toHaveText('Dungeon Odyssey');
    await pin(page, 'new-02-new-first');
  });

  test('new chapter checks interval and notifications', async ({ page }) => {
    await openLibrary(page);
    await expect(settingsButton(page)).toHaveAccessibleName(
      'New chapter checks: Every 6h',
    );
    await settingsButton(page).click();
    await expect(
      page.getByRole('menuitemradio', { name: 'Every 6 hours' }),
    ).toHaveAttribute('aria-checked', 'true');
    await pin(page, 'new-03-settings-menu');
    await page.getByRole('menuitemradio', { name: 'Once a day' }).click();
    await expect(settingsButton(page)).toHaveAccessibleName(
      'New chapter checks: Daily',
    );
    await settingsButton(page).click();
    await page
      .getByRole('menuitemcheckbox', { name: 'Desktop notifications' })
      .click();
    await settingsButton(page).click();
    await expect(
      page.getByRole('menuitemcheckbox', { name: 'Desktop notifications' }),
    ).toHaveAttribute('aria-checked', 'true');
    await pin(page, 'new-04-notifications-on');
  });

  test('clicking a new chapter opens it in a new tab', async ({ page }) => {
    await openLibrary(page);
    const popup = page.waitForEvent('popup');
    await row(page, 'The Executioner')
      .getByRole('link', { name: 'New · Ch. 47' })
      .click();
    const tab = await popup;
    await tab.waitForLoadState();
    events.push(`popup: ${tab.url()}`);
    await tab.close();
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
    await expect(page.getByRole('button', { name: 'Dismiss' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sent' })).toBeDisabled();
    await pin(page, 'add-03-success');
    await expect(page.getByText('Website proposed. Thanks!')).toBeHidden({
      timeout: 7000,
    });
    await expect(propose).toBeDisabled();
    await pin(page, 'add-04-success-dismissed');
  });

  test('verified websites filter and pagination', async ({ page }) => {
    await openLibrary(page);
    await goToAddWebsite(page);
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('11–20 of 134')).toBeVisible();
    await pin(page, 'add-list-01-page-2');
    await page.getByRole('button', { name: 'First page' }).click();
    await page.getByRole('button', { name: 'Last page' }).click();
    await expect(page.getByText('131–134 of 134')).toBeVisible();
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
      page.getByText('No verified website matches “nothing-here”.'),
    ).toBeVisible();
    await pin(page, 'add-list-04-filter-no-match');
  });
});
