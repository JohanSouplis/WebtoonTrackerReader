import { expect, Locator, Page, test } from '@playwright/test';
import verifiedWebsites from '../src/app/core/domain/verified-websites.json';

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

async function expectAnnounced(page: Page, text: string) {
  await expect
    .poll(async () =>
      (await page.locator('body').ariaSnapshot()).includes(text),
    )
    .toBe(true);
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
  return page.getByRole('button', { name: /^Checks / });
}

async function openLibrary(page: Page) {
  await page.goto('/');
  await expect(library(page).getByRole('listitem')).toHaveCount(10);
  await expectSortedBy(page, 'Last read (descending)');
}

async function deleteEveryRow(page: Page) {
  await showAllRows(page);
  for (let left = 20; left > 0; left -= 1) {
    await library(page)
      .getByRole('button', { name: /^Delete / })
      .first()
      .click();
    await expect(library(page).getByRole('listitem')).toHaveCount(left - 1);
    await page.waitForTimeout(350);
  }
}

async function setPageSize(page: Page, size: string) {
  await page.getByRole('combobox', { name: /Rows per page$/ }).click();
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
  await page.getByRole('button', { name: 'Request a site' }).click();
  await expect(
    page.getByRole('heading', { name: 'Request a site' }),
  ).toBeVisible();
}

test.describe('navbar', () => {
  test('navbar switches between library and add website', async ({ page }) => {
    await openLibrary(page);
    await expect(page).toHaveTitle('Scan Tracker');
    await expect(page.getByRole('button', { name: 'Library' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await pin(page, 'nav-01-library-selected');
    await goToAddWebsite(page);
    await expect(page).toHaveURL(/#\/add_website_pattern$/);
    await expect(
      page.getByRole('button', { name: 'Request a site' }),
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
      name: 'Send anonymous diagnostics',
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
      page.getByRole('heading', { name: 'Request a site' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Request a site' }),
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
      page.getByRole('heading', { name: 'No series match' }),
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

  test('an empty library explains tracking and hides its tools', async ({
    page,
  }) => {
    await openLibrary(page);
    await deleteEveryRow(page);
    await expect(
      page.getByRole('heading', { name: 'No series yet' }),
    ).toBeVisible();
    await expect(
      page.getByRole('searchbox', { name: 'Filter by title' }),
    ).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Sort by' })).toHaveCount(0);
    await page.mouse.move(0, 0);
    await expect(page.getByText(/Removed “/)).toBeHidden({ timeout: 8000 });
    await pin(page, 'scan-empty-03-empty-library');
    await page.getByRole('link', { name: 'See supported sites' }).click();
    await expect(page).toHaveURL(/#\/add_website_pattern$/);
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
    await expectAnnounced(page, 'Following “Worthless Regression”');
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

  test('change and clear the rating on a row', async ({ page }) => {
    await openLibrary(page);
    const rating = row(page, 'Duke Pendragon').getByRole('button', {
      name: /^Rating for Duke Pendragon/,
    });
    await expect(rating).toHaveAccessibleName(
      'Rating for Duke Pendragon: not rated',
    );
    await rating.click();
    await pin(page, 'scan-rating-01-menu-open');
    await page.getByRole('menuitemradio', { name: '3', exact: true }).click();
    await expect(rating).toHaveAccessibleName(
      'Rating for Duke Pendragon: 3/10',
    );
    await pin(page, 'scan-rating-02-duke-pendragon-rated-3');
    await toggle(page, 'Rated only').click();
    await expect(row(page, 'Duke Pendragon')).toHaveCount(1);
    await pin(page, 'scan-rating-03-rated-only-includes-it');
    await rating.click();
    await page.getByRole('menuitem', { name: 'Clear rating' }).click();
    await expect(row(page, 'Duke Pendragon')).toHaveCount(0);
    await pin(page, 'scan-rating-04-cleared-leaves-rated-only');
  });

  test('arrow keys on a closed rating do not rate', async ({ page }) => {
    await openLibrary(page);
    const rating = row(page, 'Duke Pendragon').getByRole('button', {
      name: /^Rating for Duke Pendragon/,
    });
    await rating.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(rating).toHaveAccessibleName(
      'Rating for Duke Pendragon: not rated',
    );
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
    await expectAnnounced(page, 'Undo');
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
    await expectAnnounced(page, 'Undo');
    await pin(page, 'scan-delete-07-undo-offered');
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(row(page, 'Local')).toHaveCount(1);
    await expect(page.getByText('20 series')).toBeVisible();
    await expect(
      row(page, 'Local').getByRole('button', { name: 'Follow Local' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await pin(page, 'scan-delete-08-undone');
  });

  test('rename a row from its menu', async ({ page }) => {
    await openLibrary(page);
    await row(page, 'Local')
      .getByRole('button', { name: 'More actions for Local' })
      .click();
    await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
    await pin(page, 'scan-correct-01-more-actions-menu');
    await page.getByRole('menuitem', { name: 'Rename' }).click();
    const field = page.getByRole('textbox', { name: 'New title for Local' });
    await expect(field).toBeFocused();
    await page.keyboard.type('Local Development');
    await pin(page, 'scan-correct-02-renaming');
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('link', { name: 'Local Development', exact: true }),
    ).toBeFocused();
    await expect(
      page.getByText('Renamed to “Local Development”'),
    ).toBeVisible();
    await expectAnnounced(page, 'Renamed to “Local Development”');
    await pin(page, 'scan-correct-03-renamed');
  });

  test('escape cancels a rename', async ({ page }) => {
    await openLibrary(page);
    await row(page, 'Local')
      .getByRole('button', { name: 'More actions for Local' })
      .click();
    await page.getByRole('menuitem', { name: 'Rename' }).click();
    await page.keyboard.type('Something else');
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('link', { name: 'Local', exact: true }),
    ).toBeFocused();
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });

  test('merge a row into another and undo it', async ({ page }) => {
    await openLibrary(page);
    await showAllRows(page);
    const source = 'The Heavenly Demon Wants a Quiet Life';
    const target = "The Heavenly Demon Can't Live a Normal Life";
    await row(page, source)
      .getByRole('button', { name: `More actions for ${source}` })
      .click();
    await page.getByRole('menuitem', { name: 'Merge with…' }).click();
    const picker = page.getByRole('dialog', {
      name: `Merge “${source}” into…`,
    });
    await expect(
      picker.getByRole('searchbox', { name: 'Find a series' }),
    ).toBeFocused();
    await page.keyboard.type('heavenly');
    await expect(
      picker
        .getByRole('list', { name: 'Series to merge into' })
        .getByRole('button'),
    ).toHaveText([target]);
    await pin(page, 'scan-correct-04-merge-picker');
    await page.keyboard.press('Enter');
    await expect(picker).toHaveCount(0);
    await expect(row(page, source)).toHaveCount(0);
    await expect(page.getByText('19 series')).toBeVisible();
    await expect(page.getByText(`Merged into “${target}”`)).toBeVisible();
    await expect(
      page.getByRole('link', { name: target, exact: true }),
    ).toBeFocused();
    await expectAnnounced(page, 'Undo');
    await pin(page, 'scan-correct-05-merged');
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(row(page, source)).toHaveCount(1);
    await expect(page.getByText('20 series')).toBeVisible();
    await pin(page, 'scan-correct-06-merge-undone');
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

  test('skip link jumps to the list and the rows per page select is named', async ({
    page,
  }) => {
    await openLibrary(page);
    await page.keyboard.press('Tab');
    const skip = page.getByRole('button', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await pin(page, 'keyboard-01-skip-link');
    await page.keyboard.press('Enter');
    await expect(library(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Local', exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole('combobox', { name: '10 Rows per page' }),
    ).toBeVisible();
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
    await expectAnnounced(page, 'Undo');
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
    await expectAnnounced(page, 'Undo');
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
    await expectAnnounced(page, 'Undo');
    await pin(page, 'scan-delete-06-after-title-sort');
  });

  test('long title is cut and its tooltip gives it whole with the chapter to continue', async ({
    page,
  }) => {
    await openLibrary(page);
    await showAllRows(page);
    const title = library(page).getByRole('link', {
      name: FULL_LONG_TITLE,
      exact: true,
    });
    expect(
      await title.evaluate((link) => link.scrollWidth > link.clientWidth),
    ).toBe(true);
    await title.hover();
    await expect(
      page
        .getByText(`${FULL_LONG_TITLE} · Continue reading Ch. `)
        .filter({ visible: true }),
    ).toBeVisible();
    await pin(page, 'scan-title-01-long-title-tooltip');
  });

  test("can't check this site explains itself on keyboard focus", async ({
    page,
  }) => {
    await openLibrary(page);
    await page
      .getByRole('link', { name: 'Duke Pendragon', exact: true })
      .focus();
    await page.keyboard.press('Tab');
    await expect(
      row(page, 'Duke Pendragon').getByText("Can't check this site"),
    ).toBeFocused();
    await expect(
      page
        .getByText(
          "This site can't be checked for new chapters. Reading it is still tracked.",
        )
        .filter({ visible: true }),
    ).toBeVisible();
    await pin(page, 'new-05-cant-check-explained');
  });

  test('relative read date shows the exact date in a tooltip', async ({
    page,
  }) => {
    await openLibrary(page);
    await row(page, 'Local').getByText('1 mo ago').hover();
    await expect(
      page.getByText('Jan 24, 2025', { exact: true }).filter({ visible: true }),
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
    await expect(
      row(page, 'Dungeon Odyssey').getByRole('link', {
        name: 'New · Ch. 119.5',
      }),
    ).toHaveAttribute(
      'href',
      'https://asuracomic.net/series/dungeon-odyssey-b688584e/chapter/119.5',
    );
    await expect(row(page, 'Duke Pendragon')).toContainText(
      "Can't check this site",
    );
    await expect(row(page, 'I Obtained a Mythic Item')).not.toContainText(
      'New',
    );
    await pin(page, 'new-01-chips');
    await sortButton(page, 'New chapters').click();
    await expectSortedBy(page, 'New chapters (descending)');
    await expect(titleLinks(page).first()).toHaveText('The Executioner');
    await expect(titleLinks(page).nth(1)).toHaveText('Dungeon Odyssey');
    await pin(page, 'new-02-new-first');
  });

  test('new chapter checks frequency, off and alerts', async ({ page }) => {
    await openLibrary(page);
    await expect(settingsButton(page)).toHaveAccessibleName(
      'Checks every 6 hours · Alerts off',
    );
    await settingsButton(page).click();
    await expect(
      page.getByRole('menuitemradio', { name: 'Every 6 hours' }),
    ).toHaveAttribute('aria-checked', 'true');
    await expect(
      page.getByText('New chapters also show as a count on the toolbar icon.'),
    ).toBeVisible();
    await pin(page, 'new-03-settings-menu');
    await page.getByRole('menuitemradio', { name: 'Once a day' }).click();
    await expect(settingsButton(page)).toHaveAccessibleName(
      'Checks once a day · Alerts off',
    );
    await settingsButton(page).click();
    await page
      .getByRole('menuitemcheckbox', { name: 'Desktop alerts' })
      .click();
    await expect(settingsButton(page)).toHaveAccessibleName(
      'Checks once a day · Alerts on',
    );
    await settingsButton(page).click();
    await page.getByRole('menuitemradio', { name: 'Off' }).click();
    await expect(settingsButton(page)).toHaveAccessibleName(
      'Checks off · Alerts on',
    );
    await pin(page, 'new-04-checks-off-alerts-on');
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

test.describe('new series to confirm', () => {
  function pendingToggle(page: Page): Locator {
    return page.getByRole('button', { name: /new series to confirm/ });
  }

  async function openPendingSeries(page: Page) {
    await page.goto('/?pending-series');
    await expect(library(page).getByRole('listitem')).toHaveCount(10);
    await expect(pendingToggle(page)).toHaveAttribute('aria-expanded', 'false');
  }

  test('new series wait above the library and open into cards by site', async ({
    page,
  }) => {
    await openPendingSeries(page);
    await expect(pendingToggle(page)).toContainText('4 new series to confirm');
    await expect(
      page.getByRole('button', { name: 'Add Doberman Online Free' }),
    ).toHaveCount(0);
    await pin(page, 'pending-01-collapsed');
    await pendingToggle(page).click();
    await expect(pendingToggle(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page
        .getByRole('list', { name: 'New series from manhwareads.com' })
        .getByRole('link'),
    ).toHaveText(['Doberman Online Free', 'Divine Spirit Martial Emperor']);
    await expect(
      page.getByRole('button', {
        name: 'Add all 2 series from manhwareads.com',
      }),
    ).toBeVisible();
    await pin(page, 'pending-02-open');
  });

  test('a corrected title adds the series under that title', async ({
    page,
  }) => {
    await openPendingSeries(page);
    await pendingToggle(page).click();
    await page
      .getByRole('button', { name: 'Edit the title of Doberman Online Free' })
      .click();
    const field = page.getByRole('textbox', {
      name: 'Title to add for Doberman Online Free',
    });
    await expect(field).toBeFocused();
    await pin(page, 'pending-03-editing');
    await page.keyboard.type('Doberman');
    await page.keyboard.press('Enter');
    await expect(
      page.getByText('Added “Doberman” to your library'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add Divine Spirit Martial Emperor' }),
    ).toBeFocused();
    await expect(pendingToggle(page)).toContainText('3 new series to confirm');
    await expect(page.getByText('21 series')).toBeVisible();
    await expectAnnounced(page, 'Added “Doberman” to your library');
    await page.mouse.move(0, 0);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await pin(page, 'pending-04-added-corrected');
  });

  test('a new series merges into a series of the library', async ({ page }) => {
    await openPendingSeries(page);
    await pendingToggle(page).click();
    await page
      .getByRole('button', {
        name: 'Merge Solo Leveling: Ragnarok IT with a series of your library',
      })
      .click();
    const picker = page.getByRole('dialog', {
      name: 'Merge “Solo Leveling: Ragnarok IT” into…',
    });
    await expect(
      picker.getByRole('searchbox', { name: 'Find a series' }),
    ).toBeFocused();
    await page.keyboard.type('ragnarok');
    await page.keyboard.press('Enter');
    await expect(picker).toHaveCount(0);
    await expect(
      page.getByText('Merged into “Solo Leveling: Ragnarok”'),
    ).toBeVisible();
    await expect(page.getByText('20 series')).toBeVisible();
    await expect(
      row(page, 'Solo Leveling: Ragnarok').getByText('Ch. 61', { exact: true }),
    ).toBeVisible();
    await expectAnnounced(page, 'Merged into “Solo Leveling: Ragnarok”');
    await pin(page, 'pending-05-merged');
  });

  test('cards are reachable and answered from the keyboard', async ({
    page,
  }) => {
    await openPendingSeries(page);
    await pendingToggle(page).focus();
    await page.keyboard.press('Enter');
    await expect(pendingToggle(page)).toHaveAttribute('aria-expanded', 'true');
    const add = page.getByRole('button', { name: 'Add Doberman Online Free' });
    for (let presses = 0; presses < 6; presses += 1) {
      if (await add.evaluate((button) => button === document.activeElement)) {
        break;
      }
      await page.keyboard.press('Tab');
    }
    await expect(add).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('button', { name: 'Add Divine Spirit Martial Emperor' }),
    ).toBeFocused();
    await expect(page.getByText('21 series')).toBeVisible();
  });

  test('an empty library points at the new series waiting above it', async ({
    page,
  }) => {
    await openPendingSeries(page);
    await deleteEveryRow(page);
    await expect(
      page.getByText(
        'Add the series above to start your library. Series read on supported sites come in by themselves.',
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'No series yet' }),
    ).toHaveCount(0);
    await page.mouse.move(0, 0);
    await expect(page.getByText(/Removed “/)).toBeHidden({ timeout: 8000 });
    await pendingToggle(page).click();
    await pin(page, 'pending-08-empty-library');
  });

  test('two series of a site that are not series stop its suggestions until the reader keeps them', async ({
    page,
  }) => {
    await openPendingSeries(page);
    await pendingToggle(page).click();
    await page
      .getByRole('button', { name: 'Not a series: Doberman Online Free' })
      .click();
    await page
      .getByRole('button', {
        name: 'Not a series: Divine Spirit Martial Emperor',
      })
      .click();
    const ignored =
      "Scan Tracker won't suggest new series from manhwareads.com anymore";
    await expect(page.getByText(ignored)).toBeVisible();
    await expect(pendingToggle(page)).toContainText('2 new series to confirm');
    await expectAnnounced(page, 'Keep suggesting');
    await pin(page, 'pending-06-site-ignored');
    await page.getByRole('button', { name: 'About' }).click();
    const ignoredSites = page.getByRole('list', { name: 'Sites you ignore' });
    await expect(ignoredSites.getByRole('listitem')).toHaveCount(2);
    await ignoredSites.scrollIntoViewIfNeeded();
    await pin(page, 'pending-07-about-ignored-sites');
    await page
      .getByRole('button', { name: 'Stop ignoring manhwareads.com' })
      .click();
    await expect(ignoredSites.getByRole('listitem')).toHaveText([
      /mangathrill\.com/,
    ]);
  });
});

test.describe('rate prompt', () => {
  function ratePrompt(page: Page): Locator {
    return page.getByRole('region', { name: 'Enjoying Scan Tracker?' });
  }

  async function openServedReaderLibrary(page: Page) {
    await page.goto('/?rate-prompt-due');
    await expect(library(page).getByRole('listitem')).toHaveCount(10);
    await expect(ratePrompt(page)).toBeVisible();
  }

  test('rate prompt sits on one line between the list and the pagination and rate it opens the reviews', async ({
    page,
  }) => {
    await openServedReaderLibrary(page);
    const list = await library(page).locator('xpath=..').boundingBox();
    const banner = await ratePrompt(page).boundingBox();
    const paginator = await page.locator('mat-paginator').boundingBox();
    expect(banner && list && banner.y).toBeGreaterThanOrEqual(
      list ? list.y + list.height : Infinity,
    );
    expect(paginator && banner && paginator.y).toBeGreaterThanOrEqual(
      banner ? banner.y + banner.height : Infinity,
    );
    expect(paginator && paginator.y + paginator.height).toBeLessThanOrEqual(
      600,
    );
    const message = await ratePrompt(page)
      .getByText('A rating helps other readers find it.')
      .boundingBox();
    const action = await ratePrompt(page)
      .getByRole('button', { name: "Don't ask again" })
      .boundingBox();
    expect(message && action && message.height).toBeLessThan(
      action ? action.height : 0,
    );
    await pin(page, 'rate-01-prompt');
    await ratePrompt(page).getByRole('button', { name: 'Rate it' }).click();
    await expect
      .poll(() => events.some((e) => e.includes('open reviews mocked')))
      .toBe(true);
    await expect(ratePrompt(page)).toBeHidden();
  });

  test('rate prompt not now focuses the list and hides it for the rest of the visit', async ({
    page,
  }) => {
    await openServedReaderLibrary(page);
    await ratePrompt(page).getByRole('button', { name: 'Not now' }).click();
    await expect(ratePrompt(page)).toBeHidden();
    await expect(library(page)).toBeFocused();
    await pin(page, 'rate-02-after-not-now');
    await goToAddWebsite(page);
    await page.getByRole('button', { name: 'Library' }).click();
    await expect(library(page).getByRole('listitem')).toHaveCount(10);
    await expect(ratePrompt(page)).toBeHidden();
    expect(events.some((e) => e.includes('open reviews mocked'))).toBe(false);
  });

  test('rate the extension stays in the about feedback section', async ({
    page,
  }) => {
    await openLibrary(page);
    await expect(ratePrompt(page)).toBeHidden();
    await page.getByRole('button', { name: 'About' }).click();
    const feedback = page.getByRole('region', { name: 'Feedback' });
    await feedback.scrollIntoViewIfNeeded();
    await pin(page, 'rate-03-about-feedback');
    await feedback.getByRole('button', { name: 'Rate the extension' }).click();
    await expect
      .poll(() => events.some((e) => e.includes('open reviews mocked')))
      .toBe(true);
  });
});

test.describe('add website', () => {
  test('request a site', async ({ page }) => {
    await openLibrary(page);
    await goToAddWebsite(page);
    const send = page.getByRole('button', { name: 'Send request' });
    const url = page.getByRole('textbox', { name: 'Chapter page URL' });
    await expect(send).toBeDisabled();
    await pin(page, 'add-01-initial');
    await url.fill('example-scans.com');
    await expect(send).toBeDisabled();
    await expect(
      page.getByText('Paste a full address, starting with https://'),
    ).toBeVisible();
    await pin(page, 'add-02-not-an-address');
    await url.fill('https://example-scans.com/series/solo/chapter-12');
    await expect(send).toBeEnabled();
    await send.click();
    await expect(page.getByText("Thanks, we'll review it.")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sent' })).toBeDisabled();
    await pin(page, 'add-03-sent');
    await url.fill('https://asurascans.com/series/solo/chapter-12');
    await page.getByRole('button', { name: 'Send request' }).click();
    await expect(page.getByText(/^\s*Already supported\./)).toBeVisible();
    await pin(page, 'add-04-already-supported');
  });

  test('a pasted address the list does not know can be requested', async ({
    page,
  }) => {
    await openLibrary(page);
    await goToAddWebsite(page);
    await page
      .getByRole('searchbox', { name: 'Filter by website or address' })
      .fill('https://unknown-scans.net/manga/chapter-3');
    await page.getByRole('button', { name: 'Request this site' }).click();
    await expect(
      page.getByRole('textbox', { name: 'Chapter page URL' }),
    ).toHaveValue('https://unknown-scans.net/manga/chapter-3');
    await expect(
      page.getByRole('textbox', { name: 'Chapter page URL' }),
    ).toBeFocused();
    await pin(page, 'add-05-request-from-list');
  });

  test('verified websites filter and pagination', async ({ page }) => {
    await openLibrary(page);
    await goToAddWebsite(page);
    await page.getByRole('button', { name: 'Next page' }).click();
    const count = verifiedWebsites.length;
    await expect(page.getByText(`11–20 of ${count}`)).toBeVisible();
    await pin(page, 'add-list-01-page-2');
    await page.getByRole('button', { name: 'First page' }).click();
    await page.getByRole('button', { name: 'Last page' }).click();
    await expect(
      page.getByText(`${count - ((count - 1) % 10)}–${count} of ${count}`),
    ).toBeVisible();
    await pin(page, 'add-list-02-last-page');
    await page.getByRole('button', { name: 'First page' }).click();
    await page
      .getByRole('searchbox', { name: 'Filter by website or address' })
      .pressSequentially('manga');
    await pin(page, 'add-list-03-filter-manga');
    await page
      .getByRole('searchbox', { name: 'Filter by website or address' })
      .fill('');
    await page
      .getByRole('searchbox', { name: 'Filter by website or address' })
      .pressSequentially('nothing-here');
    await expect(
      page.getByText('No verified website matches “nothing-here”.'),
    ).toBeVisible();
    await pin(page, 'add-list-04-filter-no-match');
  });
});
