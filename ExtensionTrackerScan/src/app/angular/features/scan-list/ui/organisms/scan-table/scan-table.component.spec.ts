import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ScanRow } from '../../../service/scan-row.vm';
import { ScanTableComponent } from './scan-table.component';

describe('ScanTableComponent', () => {
  it('should ask to delete the scan when its delete icon is clicked', async () => {
    const deleted = jest.fn();
    await renderTable({ deleted });

    await userEvent.click(
      within(rowOf('Solo Leveling')).getByRole('img', {
        name: 'assets/delete.png',
      }),
    );

    expect(deleted).toHaveBeenCalledWith(SOLO_LEVELING);
  });

  it('should ask to toggle the favorite when the star of a scan is clicked', async () => {
    const favoriteToggled = jest.fn();
    await renderTable({ favoriteToggled });

    await userEvent.click(
      within(rowOf('Solo Leveling')).getByRole('button', {
        name: 'Favorite',
      }),
    );

    expect(favoriteToggled).toHaveBeenCalledWith(SOLO_LEVELING);
  });

  it('should ask to open the scan url when its title is clicked', async () => {
    const opened = jest.fn();
    await renderTable({ opened });

    await userEvent.click(screen.getByText('Solo Leveling'));

    expect(opened).toHaveBeenCalledWith(SOLO_LEVELING.url);
  });

  it('should rate the scan with the picked rating when a rating is selected', async () => {
    const rated = jest.fn();
    await renderTable({ rated });

    await userEvent.click(within(rowOf('Solo Leveling')).getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: '3' }));

    expect(rated).toHaveBeenCalledWith({ scan: SOLO_LEVELING, rating: 3 });
  });
});

const SOLO_LEVELING: ScanRow = {
  title: 'Solo Leveling',
  chapter: 38,
  url: 'https://asuracomic.net/series/solo-leveling/chapter/37',
  readAt: new Date('2024-07-13T09:45:30Z'),
  isFavorite: false,
};

const OMNISCIENT_READER: ScanRow = {
  title: 'Omniscient Reader',
  chapter: 246,
  url: 'https://asuracomic.net/series/omniscient-reader/chapter/246',
  readAt: new Date('2024-12-01T19:15:25Z'),
  isFavorite: true,
  rating: 9,
};

const rowOf = (title: string): HTMLElement =>
  screen.getByRole('row', { name: new RegExp(title) });

const renderTable = (outputs: Record<string, jest.Mock>) =>
  render(ScanTableComponent, {
    inputs: { scans: [SOLO_LEVELING, OMNISCIENT_READER], titleFilter: '' },
    on: outputs,
    providers: [provideNoopAnimations()],
  });
