import { Component } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FixedClock } from '../../../../../core/gateways/in-memory/fixed-clock.gateway';
import { InMemoryRatePromptRepository } from '../../../../../core/gateways/in-memory/in-memory-rate-prompt-repository.gateway';
import { AnswerRatePromptUseCase } from '../../../../../core/use-cases/answer-rate-prompt.use-case';
import {
  FULL_PAGE_NAVIGATOR,
  STORE_LISTING,
} from '../../../../injection-tokens';
import { AppShellPage } from './app-shell.page';

@Component({ template: '<h1>Library page</h1>' })
class LibraryStubPage {}

@Component({ template: '<h1>Add website page</h1>' })
class AddWebsiteStubPage {}

describe('AppShellPage', () => {
  it('should mark Add website as the current page when the popup opens on its route', async () => {
    await renderShell('add_website_pattern');

    expect(
      await screen.findByRole('heading', { name: 'Add website page' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add website' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('should show the library and mark it current when Library is clicked', async () => {
    await renderShell('add_website_pattern');

    await userEvent.click(screen.getByRole('button', { name: 'Library' }));

    expect(
      await screen.findByRole('heading', { name: 'Library page' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Library' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('should open the full page when Informations is chosen in its menu', async () => {
    const openFullPage = jest.fn();
    await renderShell('', { openFullPage });

    await userEvent.click(screen.getByRole('button', { name: 'Informations' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /Informations/ }),
    );

    expect(openFullPage).toHaveBeenCalled();
  });

  it('should never ask for a rating again and then open the reviews when Rate the extension is chosen', async () => {
    const ratePromptRepository = new InMemoryRatePromptRepository();
    const statesWhenOpened: unknown[] = [];
    await renderShell('', {
      ratePromptRepository,
      openReviews: async () =>
        statesWhenOpened.push((await ratePromptRepository.load())?.state),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Informations' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /Rate the extension/ }),
    );

    await waitFor(() => expect(statesWhenOpened).toEqual([{ kind: 'rated' }]));
  });
});

const renderShell = (
  initialRoute: string,
  {
    openFullPage = jest.fn(),
    openReviews = jest.fn(),
    ratePromptRepository = new InMemoryRatePromptRepository(),
  }: {
    openFullPage?: () => void;
    openReviews?: () => void;
    ratePromptRepository?: InMemoryRatePromptRepository;
  } = {},
) =>
  render(AppShellPage, {
    routes: [
      { path: '', component: LibraryStubPage },
      { path: 'add_website_pattern', component: AddWebsiteStubPage },
    ],
    initialRoute,
    providers: [
      { provide: FULL_PAGE_NAVIGATOR, useValue: { openFullPage } },
      { provide: STORE_LISTING, useValue: { openReviews } },
      {
        provide: AnswerRatePromptUseCase,
        useValue: new AnswerRatePromptUseCase(
          ratePromptRepository,
          new FixedClock(),
        ),
      },
    ],
  });
