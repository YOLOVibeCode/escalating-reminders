import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';

import { ContactOptIn } from './contact-opt-in';
import {
  SMS_SUPPORT_EMAIL,
  buildTrustedContactOptInLabel,
} from '../../../../packages/@er/constants/src/sms-compliance';

const mockedGet = jest.fn();
const mockedPost = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]): unknown => mockedGet(...args),
    post: (...args: unknown[]): unknown => mockedPost(...args),
  },
}));

const VIEW = {
  inviterName: 'Jordan',
  contactName: 'Pat',
  phoneLastFour: '0199',
  optedIn: false,
  consentLabel: buildTrustedContactOptInLabel('Jordan'),
  consentTextVersion: '2026-10-11',
};

describe('ContactOptIn (trusted contact opt-in page)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockResolvedValue(VIEW);
    mockedPost.mockResolvedValue({ status: 'OPTED_IN' });
  });

  it('says who invited them, what they will get, and shows an unchecked box with the exact wording', async () => {
    render(createElement(ContactOptIn, { token: 'tok_0123456789abcdef' }));

    expect(await screen.findByText('Jordan asked you to be a trusted contact')).toBeInTheDocument();
    const facts = screen.getByTestId('contact-optin-facts');
    expect(facts).toHaveTextContent('Message and data rates may apply');
    expect(facts).toHaveTextContent('Reply STOP to opt out');
    expect(facts).toHaveTextContent(SMS_SUPPORT_EMAIL);
    expect(screen.getByTestId('contact-optin-consent-label')).toHaveTextContent(VIEW.consentLabel);
    expect(screen.getByTestId('checkbox-contact-optin-consent')).not.toBeChecked();
    expect(screen.getByRole('link', { name: 'SMS Terms' })).toHaveAttribute('href', '/terms#sms');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
  });

  it('refuses a number without the box checked and sends nothing', async () => {
    render(createElement(ContactOptIn, { token: 'tok_0123456789abcdef' }));
    fireEvent.change(await screen.findByTestId('input-contact-optin-phone'), {
      target: { value: '512-555-0199' },
    });
    fireEvent.click(screen.getByTestId('btn-contact-optin'));

    expect(await screen.findByTestId('error-contact-optin')).toHaveTextContent(
      'A number alone is not consent',
    );
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('opts in when the box is checked', async () => {
    render(createElement(ContactOptIn, { token: 'tok_0123456789abcdef' }));
    fireEvent.change(await screen.findByTestId('input-contact-optin-phone'), {
      target: { value: '512-555-0199' },
    });
    fireEvent.click(screen.getByTestId('checkbox-contact-optin-consent'));
    fireEvent.click(screen.getByTestId('btn-contact-optin'));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/public/trusted-contact-optin/tok_0123456789abcdef', {
        phone: '512-555-0199',
        consent: true,
      });
    });
    expect(await screen.findByTestId('contact-optin-done')).toHaveTextContent('You are opted in');
  });

  it('shows a dead link as not valid', async () => {
    mockedGet.mockRejectedValue(new Error('This link is not valid any more.'));
    render(createElement(ContactOptIn, { token: 'tok_0123456789abcdef' }));

    expect(await screen.findByTestId('contact-optin-invalid')).toHaveTextContent('not valid');
  });
});
