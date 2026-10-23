import { FormControl, FormGroup } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import {
  isChapterUrl,
  ProposalStatus,
} from '../../../service/site-request.rules';
import { WebsiteProposalFormComponent } from './website-proposal-form.component';
import { WebsiteProposalForm } from './website-proposal-form.types';

describe('WebsiteProposalFormComponent', () => {
  it('should ask for the address of a chapter page, not the series list', async () => {
    await renderForm({ status: 'idle' });

    expect(
      screen.getByRole('textbox', { name: 'Chapter page URL' }),
    ).toHaveAccessibleDescription(
      /Use the address of a page where you read a chapter, not the series list/,
    );
  });

  it('should keep Send request disabled and explain when the text is not an address', async () => {
    await renderForm({ status: 'idle' });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Chapter page URL' }),
      'example-scans.com',
    );

    expect(screen.getByRole('button', { name: 'Send request' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Paste a full address, starting with https://',
    );
  });

  it('should send the typed address without surrounding spaces when Enter is pressed', async () => {
    const proposed = jest.fn();
    await renderForm({ status: 'idle', proposed });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Chapter page URL' }),
      ' https://example-scans.com/chapter-1 {Enter}',
    );

    expect(proposed).toHaveBeenCalledWith(
      'https://example-scans.com/chapter-1',
    );
  });

  it.each`
    status                 | button            | message
    ${'sending'}           | ${'Sending…'}     | ${''}
    ${'sent'}              | ${'Sent'}         | ${"Thanks, we'll review it."}
    ${'already-supported'} | ${'Send request'} | ${'Already supported. Read a chapter on this site and it shows up in your library.'}
  `(
    'should show $button disabled and say "$message" when the request is $status',
    async ({ status, button, message }) => {
      await renderForm({ status });

      expect(screen.getByRole('button', { name: button })).toBeDisabled();
      expect(screen.getByRole('status')).toHaveTextContent(message);
    },
  );

  it('should offer to retry when the request could not be sent', async () => {
    const proposed = jest.fn();
    await renderForm({
      status: 'failed',
      proposed,
      value: 'https://example-scans.com/chapter-1',
    });

    expect(screen.getByRole('status')).toHaveTextContent("Couldn't send.");
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(proposed).toHaveBeenCalledWith(
      'https://example-scans.com/chapter-1',
    );
  });
});

const renderForm = ({
  status,
  proposed = jest.fn(),
  value = '',
}: {
  status: ProposalStatus;
  proposed?: jest.Mock;
  value?: string;
}) => {
  const form: WebsiteProposalForm = new FormGroup({
    website: new FormControl(value, {
      nonNullable: true,
      validators: (control) =>
        isChapterUrl(control.value) ? null : { chapterUrl: true },
    }),
  });
  return render(WebsiteProposalFormComponent, {
    inputs: { form, status },
    on: { proposed },
  });
};
