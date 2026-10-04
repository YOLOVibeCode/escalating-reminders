import type { HostRule } from '@/lib/env-chrome/chrome';

/**
 * EscalatingReminders web app hostname → environment rules for the shared
 * env-chrome pattern. See `/Users/admin/.claude/plans/lovely-bouncing-pelican.md`
 * for the spec these follow. Production domain is TBD; update the last two
 * lines when the real production hostname is set.
 */
export const HOST_RULES: readonly HostRule[] = [
  [/^dev\.escalating-reminders\./i, 'dev'],
  [/^staging\.escalating-reminders\./i, 'uat'],
  [/^uat\.escalating-reminders\./i, 'uat'],
  [/^(www\.)?escalating-reminders\./i, 'production'],
  [/^(localhost|127\.0\.0\.1|\[::1\])$/i, 'local'],
];
