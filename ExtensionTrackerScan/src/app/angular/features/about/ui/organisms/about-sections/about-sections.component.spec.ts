import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AboutSectionsComponent } from './about-sections.component';

describe('AboutSectionsComponent', () => {
  it('should explain that the history and the opened pages are read', async () => {
    await renderSections();

    expect(
      screen.getByRole('region', { name: 'What gets tracked' }),
    ).toHaveTextContent(
      'It reads your browser history every hour and every chapter page you open',
    );
  });

  it('should say which page details are sent to the developer', async () => {
    await renderSections();

    expect(screen.getByRole('region', { name: 'Privacy' })).toHaveTextContent(
      "sends that page's address and title to the developer",
    );
  });

  it('should ask to stop the parse reports when their switch is turned off', async () => {
    const parseReportsToggled = jest.fn();
    await renderSections({ parseReportsToggled });

    await userEvent.click(
      screen.getByRole('switch', { name: 'Send anonymous parse reports' }),
    );

    expect(parseReportsToggled).toHaveBeenCalledWith(false);
  });

  it('should link the GitHub issues for contact', async () => {
    await renderSections();

    expect(
      screen.getByRole('link', {
        name: 'Report a problem or ask a question on GitHub',
      }),
    ).toHaveAttribute(
      'href',
      'https://github.com/JohanSouplis/WebtoonTrackerReader/issues',
    );
  });

  it('should show the version of the extension', async () => {
    await renderSections();

    expect(
      screen.getByText('Scan Tracker · version 1.2.1'),
    ).toBeInTheDocument();
  });
});

const renderSections = (outputs: Record<string, jest.Mock> = {}) =>
  render(AboutSectionsComponent, {
    inputs: { version: '1.2.1', sendsParseReports: true },
    on: outputs,
  });
