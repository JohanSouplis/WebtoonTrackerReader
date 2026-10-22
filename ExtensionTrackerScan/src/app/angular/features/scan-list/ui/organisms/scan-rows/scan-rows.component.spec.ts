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

  it('should show the chapter, the time since the reading and the website of a scan', async () => {
    await renderRows(SHOWN_SCANS);

    const row = rowOf('Solo Leveling');
    expect(row).toHaveTextContent('Ch. 38');
    expect(row).toHaveTextContent('8 mo ago');
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

  it('should ask to delete the scan when its delete button is clicked', async () => {
    const deleted = jest.fn();
    await renderRows(SHOWN_SCANS, { deleted });

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete Solo Leveling' }),
    );

    expect(deleted).toHaveBeenCalledWith(SOLO_LEVELING);
  });

  it('should ask to toggle the favorite when the star of a scan is clicked', async () => {
    const favoriteToggled = jest.fn();
    await renderRows(SHOWN_SCANS, { favoriteToggled });

    await userEvent.click(
      screen.getByRole('button', { name: 'Favorite Solo Leveling' }),
    );

    expect(favoriteToggled).toHaveBeenCalledWith(SOLO_LEVELING);
  });

  it('should rate the scan with the picked rating when a rating is selected', async () => {
    const rated = jest.fn();
    await renderRows(SHOWN_SCANS, { rated });

    await userEvent.click(
      within(
        screen.getByRole('combobox', { name: 'Rating for Solo Leveling' }),
      ).getByText('–'),
    );
    await userEvent.click(screen.getByRole('option', { name: '3' }));

    expect(rated).toHaveBeenCalledWith({ scan: SOLO_LEVELING, rating: 3 });
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

  it('should explain how scans appear when the library is empty', async () => {
    await renderRows({ kind: 'empty-library' });

    expect(
      screen.getByRole('heading', { name: 'No reads yet' }),
    ).toBeInTheDocument();
  });
});

const THUMBNAIL = 'data:image/webp;base64,UklGRg==';

const SOLO_LEVELING = aShownScan({
  title: 'Solo Leveling',
  chapter: 38,
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
