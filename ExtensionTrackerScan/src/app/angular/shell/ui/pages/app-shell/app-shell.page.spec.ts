import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AppShellPage } from './app-shell.page';

@Component({
  template:
    '<h1>Library page</h1><ul aria-label="Library" tabindex="-1" data-skip-target></ul>',
})
class LibraryStubPage {}

@Component({ template: '<h1>Add website page</h1>' })
class AddWebsiteStubPage {}

@Component({ template: '<h1>About page</h1>' })
class AboutStubPage {}

describe('AppShellPage', () => {
  it('should mark Request a site as the current page when the popup opens on its route', async () => {
    await renderShell('add_website_pattern');

    expect(
      await screen.findByRole('heading', { name: 'Add website page' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Request a site' }),
    ).toHaveAttribute('aria-current', 'page');
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

  it('should move the focus to the library list when Skip to content is pressed', async () => {
    await renderShell('');
    await screen.findByRole('heading', { name: 'Library page' });

    await userEvent.tab();
    expect(
      screen.getByRole('button', { name: 'Skip to content' }),
    ).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('list', { name: 'Library' })).toHaveFocus();
  });

  it('should show the about page and mark it current when About is clicked', async () => {
    await renderShell('');

    await userEvent.click(screen.getByRole('button', { name: 'About' }));

    expect(
      await screen.findByRole('heading', { name: 'About page' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'About' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

const renderShell = (initialRoute: string) =>
  render(AppShellPage, {
    routes: [
      { path: '', component: LibraryStubPage },
      { path: 'add_website_pattern', component: AddWebsiteStubPage },
      { path: 'about', component: AboutStubPage },
    ],
    initialRoute,
  });
