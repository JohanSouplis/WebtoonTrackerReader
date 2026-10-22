import { FormControl, FormGroup, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { WebsiteProposalFormComponent } from './website-proposal-form.component';
import { WebsiteProposalForm } from './website-proposal-form.types';

describe('WebsiteProposalFormComponent', () => {
  it('should explain that a website url is the one where a chapter is read', async () => {
    await renderForm({ isProposalSent: false });

    expect(
      screen.getByText(/Use the URL of the page where you/),
    ).toHaveTextContent(
      'Use the URL of the page where you read a chapter, not the series list.',
    );
  });

  it('should keep Propose disabled when no website is typed', async () => {
    await renderForm({ isProposalSent: false });

    expect(screen.getByRole('button', { name: 'Propose' })).toBeDisabled();
  });

  it('should propose the typed website without surrounding spaces when Propose is clicked', async () => {
    const proposed = jest.fn();
    await renderForm({ isProposalSent: false, proposed });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Website name' }),
      ' example-scans.com ',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Propose' }));

    expect(proposed).toHaveBeenCalledWith('example-scans.com');
  });

  it('should propose the typed website when Enter is pressed in the field', async () => {
    const proposed = jest.fn();
    await renderForm({ isProposalSent: false, proposed });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Website name' }),
      'example-scans.com{Enter}',
    );

    expect(proposed).toHaveBeenCalledWith('example-scans.com');
  });

  it('should show a disabled Sent button when the proposal is sent', async () => {
    await renderForm({ isProposalSent: true });

    expect(screen.getByRole('button', { name: 'Sent' })).toBeDisabled();
  });
});

const renderForm = ({
  isProposalSent,
  proposed = jest.fn(),
}: {
  isProposalSent: boolean;
  proposed?: jest.Mock;
}) => {
  const form: WebsiteProposalForm = new FormGroup({
    website: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
  });
  return render(WebsiteProposalFormComponent, {
    inputs: { form, isProposalSent },
    on: { proposed },
  });
};
