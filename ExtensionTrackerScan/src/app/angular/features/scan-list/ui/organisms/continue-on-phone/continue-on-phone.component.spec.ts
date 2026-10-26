import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { PhoneHandoff } from '../../../service/scan-row.vm';
import { ContinueOnPhoneComponent } from './continue-on-phone.component';

describe('ContinueOnPhoneComponent', () => {
  it('should show the series, the chapter to read and its address beside its QR code', async () => {
    await renderHandoff();

    expect(
      screen.getByRole('heading', { name: 'Continue on phone' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Solo Leveling')).toBeInTheDocument();
    expect(screen.getByText('New · Ch. 39')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'QR code of New · Ch. 39 of Solo Leveling',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(HANDOFF.url)).toBeInTheDocument();
  });

  it('should ask to close when Close is clicked', async () => {
    const closed = jest.fn();
    await renderHandoff({ closed });

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(closed).toHaveBeenCalled();
  });
});

const HANDOFF: PhoneHandoff = {
  title: 'Solo Leveling',
  chapterLabel: 'New · Ch. 39',
  url: 'https://asuracomic.net/series/solo-leveling/chapter/39',
};

const renderHandoff = (outputs: Record<string, jest.Mock> = {}) =>
  render(ContinueOnPhoneComponent, {
    inputs: { handoff: HANDOFF },
    on: outputs,
  });
