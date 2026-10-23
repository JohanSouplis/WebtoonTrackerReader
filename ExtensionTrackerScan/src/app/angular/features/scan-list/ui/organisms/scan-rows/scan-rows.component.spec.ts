import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ScanListView } from '../../../service/scan-list-view.vm';
import { aShownScan } from '../../../service/scan-rows.fixture';
import { ScanRowsComponent } from './scan-rows.component';

describe('ScanRowsComponent', () => {
  it('should link each title to its last read chapter in a new tab', async () => {
    await renderRows(SHOWN_SCANS);

    expect(screen.getByRole('link', { name: 'Solo Leveling' })).toHaveAttribute(
      'href',
      SOLO_LEVELING.url,
    );
    expect(screen.getByRole('link', { name: 'Solo Leveling' })).toHaveAttribute(
      'target',
      '_blank',
    );
  });

  it('should describe the title link as a way to continue reading', async () => {
    await renderRows(SHOWN_SCANS);

    expect(
      screen.getByRole('link', { name: 'Solo Leveling' }),
    ).toHaveAccessibleDescription('Continue reading Ch. 38');
  });

  it('should show the chapter, the time since the reading and the website of a scan', async () => {
    await renderRows(SHOWN_SCANS);

    const row = rowOf('Solo Leveling');
    expect(row).toHaveTextContent('Ch. 38');
    expect(row).toHaveTextContent('read 8 mo ago');
    expect(row).toHaveTextContent('asuracomic.net');
  });

  it('should show the cover of a scan beside its title when it has one', async () => {
    await renderRows(SHOWN_SCANS);

    expect(
      within(rowOf('Omniscient Reader')).getByRole('presentation'),
    ).toHaveAttribute('src', THUMBNAIL);
    expect(rowOf('Omniscient Reader')).not.toHaveTextContent('OR');
  });

  it('should show the initials of a scan without a cover', async () => {
    await renderRows(SHOWN_SCANS);

    expect(rowOf('Solo Leveling')).toHaveTextContent('SL');
    expect(
      within(rowOf('Solo Leveling')).queryByRole('presentation'),
    ).not.toBeInTheDocument();
  });

  it('should show neither a cover nor initials while the cover is unknown', async () => {
    await renderRows({
      ...SHOWN_SCANS,
      rows: [{ ...SOLO_LEVELING, cover: { kind: 'pending' } }],
    });

    expect(rowOf('Solo Leveling')).not.toHaveTextContent('SL');
    expect(
      within(rowOf('Solo Leveling')).queryByRole('presentation'),
    ).not.toBeInTheDocument();
  });

  it('should link the new chapter of a scan beside its last read chapter', async () => {
    await renderRows({
      ...SHOWN_SCANS,
      rows: [
        {
          ...SOLO_LEVELING,
          watch: {
            kind: 'new',
            chapter: 39,
            url: 'https://asuracomic.net/series/solo-leveling/chapter/39',
          },
        },
      ],
    });

    const newChapter = within(rowOf('Solo Leveling')).getByRole('link', {
      name: 'New · Ch. 39',
    });
    expect(newChapter).toHaveAttribute(
      'href',
      'https://asuracomic.net/series/solo-leveling/chapter/39',
    );
    expect(newChapter).toHaveAttribute('target', '_blank');
  });

  it('should say when the website of a scan cannot be checked for new chapters', async () => {
    await renderRows({
      ...SHOWN_SCANS,
      rows: [{ ...SOLO_LEVELING, watch: { kind: 'unsupported' } }],
    });

    expect(rowOf('Solo Leveling')).toHaveTextContent("Can't check this site");
    const note = within(rowOf('Solo Leveling')).getByText(
      "Can't check this site",
    );
    expect(note).toHaveAttribute('tabindex', '0');
    expect(note).toHaveAccessibleDescription(
      "This site can't be checked for new chapters. Reading it is still tracked.",
    );
    expect(
      within(rowOf('Solo Leveling')).queryByRole('link', { name: /^New/ }),
    ).not.toBeInTheDocument();
  });

  it('should ask to delete the scan when its delete button is clicked', async () => {
    const deleted = jest.fn();
    await renderRows(SHOWN_SCANS, { deleted });

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete Solo Leveling' }),
    );

    expect(deleted).toHaveBeenCalledWith(SOLO_LEVELING);
  });

  it('should delete once when the delete button is double-clicked, since the next row slides under the pointer', async () => {
    const deleted = jest.fn();
    await renderRows(SHOWN_SCANS, { deleted });

    await userEvent.dblClick(
      screen.getByRole('button', { name: 'Delete Solo Leveling' }),
    );

    expect(deleted).toHaveBeenCalledTimes(1);
  });

  it('should move the focus to the next title when a scan is deleted', async () => {
    await renderRows(SHOWN_SCANS);

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete Solo Leveling' }),
    );

    expect(
      screen.getByRole('link', { name: 'Omniscient Reader' }),
    ).toHaveFocus();
  });

  it('should move the focus to the previous title when the last scan is deleted', async () => {
    await renderRows(SHOWN_SCANS);

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete Omniscient Reader' }),
    );

    expect(screen.getByRole('link', { name: 'Solo Leveling' })).toHaveFocus();
  });

  it('should ask to toggle the favorite when the bell of a scan is clicked', async () => {
    const favoriteToggled = jest.fn();
    await renderRows(SHOWN_SCANS, { favoriteToggled });

    await userEvent.click(
      screen.getByRole('button', { name: 'Follow Solo Leveling' }),
    );

    expect(favoriteToggled).toHaveBeenCalledWith(SOLO_LEVELING);
  });

  it('should rate the scan with the picked rating when a rating is chosen in its menu', async () => {
    const rated = jest.fn();
    await renderRows(SHOWN_SCANS, { rated });

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Rating for Solo Leveling: not rated',
      }),
    );
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: '3' }),
    );

    expect(rated).toHaveBeenCalledWith({ scan: SOLO_LEVELING, rating: 3 });
  });

  it('should show a rating out of 10 and offer to clear it', async () => {
    const ratingCleared = jest.fn();
    await renderRows(SHOWN_SCANS, { ratingCleared });

    await userEvent.click(
      screen.getByRole('button', {
        name: /^Rating for Omniscient Reader: 9 ?\/10$/,
      }),
    );
    expect(
      await screen.findByRole('menuitemradio', { name: '9' }),
    ).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Clear rating' }),
    );

    expect(ratingCleared).toHaveBeenCalledWith(OMNISCIENT_READER);
  });

  it('should keep the rating when the arrow keys are pressed on the closed rating button', async () => {
    const rated = jest.fn();
    await renderRows(SHOWN_SCANS, { rated });

    screen
      .getByRole('button', { name: 'Rating for Solo Leveling: not rated' })
      .focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');

    expect(rated).not.toHaveBeenCalled();
  });

  it('should ask for the next page when Next page is clicked', async () => {
    const pageTurned = jest.fn();
    await renderRows({ ...SHOWN_SCANS, length: 12 }, { pageTurned });

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(pageTurned).toHaveBeenCalledWith({ index: 1, size: 10 });
  });

  it('should name the searched title and offer to clear the filters when nothing matches', async () => {
    const filtersCleared = jest.fn();
    await renderRows(
      { kind: 'no-match', searchedTitle: 'zzz' },
      { filtersCleared },
    );

    expect(
      screen.getByText('Nothing in your library for “zzz”.'),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Clear filters' }),
    );
    expect(filtersCleared).toHaveBeenCalled();
  });

  it('should talk about the filters when nothing matches without a searched title', async () => {
    await renderRows({ kind: 'no-match', searchedTitle: '' });

    expect(
      screen.getByText('Nothing in your library for “these filters”.'),
    ).toBeInTheDocument();
  });

  it('should explain that series are added by themselves and link the supported sites when the library is empty', async () => {
    await renderRows({ kind: 'empty-library' });

    expect(
      screen.getByRole('region', { name: 'No series yet' }),
    ).toHaveTextContent(
      'It reads your browser history every hour and every chapter page you open.',
    );
    expect(
      screen.getByRole('link', { name: 'See supported sites' }),
    ).toHaveAttribute('href', '#/add_website_pattern');
  });

  it('should show a busy placeholder list while the library loads', async () => {
    await renderRows({ kind: 'loading' });

    expect(
      screen.getByRole('list', { name: 'Loading your library' }),
    ).toHaveAttribute('aria-busy', 'true');
  });

  it('should alert and offer to retry when the library cannot be loaded', async () => {
    const retried = jest.fn();
    await renderRows({ kind: 'failed' }, { retried });

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't load your library",
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(retried).toHaveBeenCalled();
  });
});

const THUMBNAIL = 'data:image/webp;base64,UklGRg==';

const SOLO_LEVELING = aShownScan({
  title: 'Solo Leveling',
  chapter: 38,
  readingHint: 'Continue reading Ch. 38',
  url: 'https://asuracomic.net/series/solo-leveling/chapter/37',
  readAt: new Date('2024-07-13T09:45:30Z'),
});

const OMNISCIENT_READER = aShownScan({
  title: 'Omniscient Reader',
  chapter: 246,
  isFavorite: true,
  rating: 9,
  cover: { kind: 'thumbnail', src: THUMBNAIL },
});

const SHOWN_SCANS = {
  kind: 'scans',
  rows: [SOLO_LEVELING, OMNISCIENT_READER],
  page: { index: 0, size: 10 },
  length: 2,
} satisfies ScanListView;

const rowOf = (title: string): HTMLElement => {
  const [row] = screen
    .getAllByRole('listitem')
    .filter((item) => within(item).queryByRole('link', { name: title }));
  return row;
};

const renderRows = (
  view: ScanListView,
  outputs: Record<string, jest.Mock> = {},
) =>
  render(ScanRowsComponent, {
    inputs: { view, now: new Date('2025-03-10T12:00:00Z') },
    on: outputs,
    providers: [provideNoopAnimations()],
  });
