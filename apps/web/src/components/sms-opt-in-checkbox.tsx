'use client';

import Link from 'next/link';

import { SMS_BRAND, SMS_PURPOSE } from '../../../../packages/@er/constants/src/sms-compliance';

interface ISmsOptInCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  testId?: string;
}

export function SmsOptInCheckbox({
  checked,
  onChange,
  disabled,
  testId = 'checkbox-sms-opt-in',
}: ISmsOptInCheckboxProps): JSX.Element {
  return (
    <label className="flex items-start gap-2 text-sm text-gray-700" htmlFor={testId}>
      <input
        id={testId}
        type="checkbox"
        data-testid={testId}
        checked={checked}
        disabled={disabled}
        onChange={(e) => { onChange(e.target.checked); }}
        className="mt-1"
      />
      <span>
        Text me {SMS_PURPOSE} from {SMS_BRAND}. Message frequency varies. Message and data rates
        may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.
        See our{' '}
        <Link href="/terms#sms" className="text-blue-600 underline">
          SMS Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-blue-600 underline">
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}
