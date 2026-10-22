import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { InMemoryScanRepository } from '../../../../../../core/gateways/in-memory/in-memory-scan-repository.gateway';
import { DeleteScanUseCase } from '../../../../../../core/use-cases/delete-scan.use-case';
import { RateScanUseCase } from '../../../../../../core/use-cases/rate-scan.use-case';
import { aScan } from '../../../../../../core/use-cases/scans.fixture';
import { ToggleFavoriteUseCase } from '../../../../../../core/use-cases/toggle-favorite.use-case';
import { SCAN_REPOSITORY } from '../../../../../injection-tokens';
import { ScanListPage } from './scan-list.page';

describe('ScanListPage', () => {
  it('should show a scan under Favorites Only and save it when its star is clicked', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Solo Leveling' }),
      aScan({ title: 'Omniscient Reader' }),
    ]);
    await renderPage(scanRepository);

    await userEvent.click(
      within(
        await screen.findByRole('row', { name: /Solo Leveling/ }),
      ).getByRole('img', { name: 'Not Favorited' }),
    );
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Favorites Only' }),
    );

    expect(screen.getByText('Solo Leveling')).toBeInTheDocument();
    expect(screen.queryByText('Omniscient Reader')).not.toBeInTheDocument();
    expect((await scanRepository.load()).snapshot()).toEqual([
      aScan({ title: 'Solo Leveling', isFavorite: true }),
      aScan({ title: 'Omniscient Reader' }),
    ]);
  });

  it('should remove a scan from the list and the library when its delete icon is clicked', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Solo Leveling' }),
      aScan({ title: 'Omniscient Reader' }),
    ]);
    await renderPage(scanRepository);

    await userEvent.click(
      within(
        await screen.findByRole('row', { name: /Solo Leveling/ }),
      ).getByRole('img', { name: 'assets/delete.png' }),
    );

    expect(await screen.findByText('Omniscient Reader')).toBeInTheDocument();
    expect(screen.queryByText('Solo Leveling')).not.toBeInTheDocument();
    expect((await scanRepository.load()).snapshot()).toEqual([
      aScan({ title: 'Omniscient Reader' }),
    ]);
  });
});

const renderPage = (scanRepository: InMemoryScanRepository) =>
  render(ScanListPage, {
    providers: [
      provideNoopAnimations(),
      { provide: SCAN_REPOSITORY, useValue: scanRepository },
      {
        provide: DeleteScanUseCase,
        useValue: new DeleteScanUseCase(scanRepository),
      },
      {
        provide: ToggleFavoriteUseCase,
        useValue: new ToggleFavoriteUseCase(scanRepository),
      },
      {
        provide: RateScanUseCase,
        useValue: new RateScanUseCase(scanRepository),
      },
    ],
  });
