import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const VERBATIM =
  'We do not share, sell, or provide your mobile phone number or SMS opt-in data to third parties or affiliates for marketing or promotional purposes.';

describe('legal pages', () => {
  const appRoot = join(__dirname, '../app');

  it('privacy page contains required SMS sentence verbatim', () => {
    const privacy = readFileSync(join(appRoot, 'privacy/page.tsx'), 'utf8');
    expect(privacy).toContain(VERBATIM);
  });

  it('terms page contains sms section', () => {
    const terms = readFileSync(join(appRoot, 'terms/page.tsx'), 'utf8');
    expect(terms).toContain('id="sms"');
    expect(terms).toContain('Message frequency varies');
    expect(terms).toContain('Carriers are not liable for delayed or undelivered messages');
  });
});
