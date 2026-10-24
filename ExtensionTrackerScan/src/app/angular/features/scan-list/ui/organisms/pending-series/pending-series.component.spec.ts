import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import {
  PendingSeriesCard,
  PendingSeriesGroup,
} from '../../../service/pending-series.vm';
import { PendingSeriesComponent } from './pending-series.component';

describe('PendingSeriesComponent', () => {
  it('should say how many series wait and show them by site only once opened', async () => {
    await renderPending();
    const toggle = screen.getByRole('button', {
      name: /^3 new series to confirm/,
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      within(
        screen.getByRole('list', { name: 'New series from manhwareads.com' }),
      )
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Doberman Online Free', 'Vagabond']);
    expect(
      within(
        screen.getByRole('list', { name: 'New series from klz9.com' }),
      ).getAllByRole('listitem')[0],
    ).toHaveTextContent('Ch. 184');
  });

  it('should offer to add all the series of a site only when it has more than one', async () => {
    const siteAdded = jest.fn();
    await renderOpened({ siteAdded });

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Add all 2 series from manhwareads.com',
      }),
    );

    expect(siteAdded).toHaveBeenCalledWith('manhwareads.com');
    expect(
      screen.queryByRole('button', { name: /^Add all \d+ series from klz9/ }),
    ).not.toBeInTheDocument();
  });

  it.each`
    button                                            | output
    ${'Add Vagabond'}                                 | ${'added'}
    ${'Not a series: Vagabond'}                       | ${'dismissed'}
    ${'Merge Vagabond with a series of your library'} | ${'mergeRequested'}
  `(
    'should ask for $output when $button is clicked',
    async ({ button, output }) => {
      const emitted = jest.fn();
      await renderOpened({ [output]: emitted });

      await userEvent.click(screen.getByRole('button', { name: button }));

      expect(emitted).toHaveBeenCalledWith(VAGABOND);
    },
  );

  it('should ask to add the series under the title the reader typed', async () => {
    const renamed = jest.fn();
    await renderOpened({ renamed });

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Edit the title of Doberman Online Free',
      }),
    );
    await userEvent.keyboard('Doberman{Enter}');

    expect(renamed).toHaveBeenCalledWith({ card: DOBERMAN, title: 'Doberman' });
  });

  it('should go back to the card without adding it when the edit is cancelled', async () => {
    const renamed = jest.fn();
    await renderOpened({ renamed });

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Edit the title of Doberman Online Free',
      }),
    );
    await userEvent.keyboard('Doberman{Escape}');

    expect(renamed).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Add Doberman Online Free' }),
    ).toHaveFocus();
  });

  it('should move the focus to the card that followed once the card acted on is gone, wherever its site moved', async () => {
    const { rerender } = await renderOpened();

    await userEvent.click(
      screen.getByRole('button', { name: 'Add Doberman Online Free' }),
    );
    await rerender({
      inputs: {
        groups: [
          { host: 'klz9.com', cards: [RAW] },
          { host: 'manhwareads.com', cards: [VAGABOND] },
        ],
        now: NOW,
      },
      partialUpdate: true,
    });

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Add Vagabond' }),
      ).toHaveFocus(),
    );
  });
});

const NOW = new Date('2025-03-10T12:00:00Z');

const cardOf = (
  title: string,
  host: string,
  chapter: number,
): PendingSeriesCard => ({
  key: `${host} ${title}`,
  title,
  chapter,
  url: `https://${host}/${chapter}`,
  host,
  seenAt: new Date('2025-03-10T09:00:00Z'),
});

const DOBERMAN = cardOf('Doberman Online Free', 'manhwareads.com', 88);

const VAGABOND = cardOf('Vagabond', 'manhwareads.com', 12);

const RAW = cardOf('Tensei Kizoku (MANGA) - RAW', 'klz9.com', 184);

const GROUPS: PendingSeriesGroup[] = [
  { host: 'manhwareads.com', cards: [DOBERMAN, VAGABOND] },
  { host: 'klz9.com', cards: [RAW] },
];

const renderPending = (outputs: Record<string, jest.Mock> = {}) =>
  render(PendingSeriesComponent, {
    inputs: { groups: GROUPS, now: NOW },
    on: outputs,
  });

const renderOpened = async (outputs: Record<string, jest.Mock> = {}) => {
  const rendered = await renderPending(outputs);
  await userEvent.click(
    screen.getByRole('button', { name: /new series to confirm/ }),
  );
  return rendered;
};
