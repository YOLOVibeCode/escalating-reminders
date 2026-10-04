import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '../../..');
const ALLOWED = 'guarded-sms-send.service.ts';

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(full, files);
    } else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('sms send surface', () => {
  it('only guarded-sms-send.service calls the relay SMS endpoint', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      if (file.endsWith(ALLOWED)) continue;
      const content = readFileSync(file, 'utf8');
      if (content.includes('api.twilio.noctusoft.com/sms/send')) {
        offenders.push(file);
      }
      if (/from\s+['"]twilio['"]/i.test(content) || /require\(['"]twilio['"]\)/.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
