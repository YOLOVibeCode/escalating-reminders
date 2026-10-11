import { render, screen } from '@testing-library/react';
import { createElement } from 'react';

import SmsPage from './page';
import {
  SMS_SUPPORT_EMAIL,
  buildSmsSelfOptInLabel,
  buildTrustedContactOptInLabel,
} from '../../../../../packages/@er/constants/src/sms-compliance';

describe('/sms public page', () => {
  it('shows the exact opt-in wording the profile page uses, never pre-checked', () => {
    render(createElement(SmsPage));

    const wording = screen.getByTestId('sms-opt-in-wording');
    expect(wording).toHaveTextContent(buildSmsSelfOptInLabel());
    expect(screen.getByRole('checkbox', { name: 'Example opt-in box' })).not.toBeChecked();
  });

  it('states frequency, rates, STOP/HELP, support, and no sharing of opt-in data', () => {
    render(createElement(SmsPage));

    const facts = screen.getByTestId('sms-program-facts');
    expect(facts).toHaveTextContent('Message frequency varies');
    expect(facts).toHaveTextContent('Message and data rates may apply');
    expect(facts).toHaveTextContent('Reply STOP to opt out');
    expect(facts).toHaveTextContent(SMS_SUPPORT_EMAIL);
    expect(facts).toHaveTextContent('do not share, sell, or provide your mobile phone number');
  });

  it('links to the SMS terms and privacy policy, and the footer links back to /sms', () => {
    render(createElement(SmsPage));

    expect(screen.getByRole('link', { name: 'SMS Terms' })).toHaveAttribute('href', '/terms#sms');
    for (const link of screen.getAllByRole('link', { name: 'Privacy Policy' })) {
      expect(link).toHaveAttribute('href', '/privacy');
    }
    expect(screen.getByTestId('link-sms')).toHaveAttribute('href', '/sms');
  });

  it('says trusted contacts opt in themselves, never texted first, with the exact box wording', () => {
    render(createElement(SmsPage));

    expect(screen.getByTestId('sms-trusted-contact-policy')).toHaveTextContent(
      'We never text a number someone else typed in',
    );
    expect(screen.getByTestId('sms-trusted-contact-wording')).toHaveTextContent(
      buildTrustedContactOptInLabel('[name]'),
    );
    expect(
      screen.getByRole('checkbox', { name: 'Example trusted contact opt-in box' }),
    ).not.toBeChecked();
  });
});
