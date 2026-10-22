import { FormControl, FormGroup, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { WebsiteProposalFormComponent } from './website-proposal-form.component';
import { WebsiteProposalForm } from './website-proposal-form.types';

describe('WebsiteProposalFormComponent', () => {
  it('should keep Ask disabled when no website is typed', async () => {
    await renderForm({ isProposalSent: false });

    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();
  });

  it('should propose the typed website when Ask is clicked', async () => {
    const proposed = jest.fn();
    await renderForm({ isProposalSent: false, proposed });

    await userEvent.type(
      screen.getByPlaceholderText('Enter website name'),
      'example-scans.com',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));

    expect(proposed).toHaveBeenCalledWith('example-scans.com');
  });

  it('should confirm the proposal and disable Ask when the proposal is sent', async () => {
    await renderForm({ isProposalSent: true });

    expect(
      screen.getByText('The website has been proposed successfully'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();
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
