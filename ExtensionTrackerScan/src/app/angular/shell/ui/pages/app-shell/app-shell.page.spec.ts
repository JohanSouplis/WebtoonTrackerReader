import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FULL_PAGE_NAVIGATOR } from '../../../../injection-tokens';
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

  it('should open the full page when Informations is clicked', async () => {
    const openFullPage = jest.fn();
    await renderShell('', openFullPage);

    await userEvent.click(screen.getByRole('button', { name: 'Informations' }));

    expect(openFullPage).toHaveBeenCalled();
  });
});

const renderShell = (initialRoute: string, openFullPage = jest.fn()) =>
  render(AppShellPage, {
    routes: [
      { path: '', component: LibraryStubPage },
      { path: 'add_website_pattern', component: AddWebsiteStubPage },
    ],
    initialRoute,
    providers: [{ provide: FULL_PAGE_NAVIGATOR, useValue: { openFullPage } }],
  });
