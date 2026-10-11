/** Enforce single-segment SMS length (GSM-7: 160 chars, UCS-2: 70 code points). */
export function assertSingleSmsSegment(body: string): void {
  const usesUcs2 = [...body].some((char) => (char.codePointAt(0) ?? 0) > 0x7f);
  const limit = usesUcs2 ? 70 : 160;
  const length = usesUcs2 ? [...body].length : body.length;
  if (length > limit) {
    throw new Error(
      `SMS body exceeds single-segment limit (${length} > ${limit} for ${usesUcs2 ? 'UCS-2' : 'GSM-7'})`,
    );
  }
}

function usesUcs2(text: string): boolean {
  return [...text].some((char) => (char.codePointAt(0) ?? 0) > 0x7f);
}

function smsLength(text: string, ucs2: boolean): number {
  return ucs2 ? [...text].length : text.length;
}

/**
 * Build a body that ends with `footer` and, once `prefix` is added in front, fits one segment.
 * The content is cut (with "...") rather than dropping the footer. A footer already present in
 * the content is not added twice.
 */
export function fitSingleSegment(content: string, opts: { prefix: string; footer: string }): string {
  const trimmed = content.trim();
  const footer = trimmed.includes(opts.footer.trim()) ? '' : opts.footer;
  const join = footer === '' ? '' : /[.!?]$/.test(trimmed) ? ' ' : '. ';
  const whole = `${opts.prefix}${trimmed}${join}${footer}`;
  const ucs2 = usesUcs2(whole);
  const limit = ucs2 ? 70 : 160;
  if (smsLength(whole, ucs2) <= limit) {
    return `${trimmed}${join}${footer}`;
  }
  const cutJoin = footer === '' ? '' : ' ';
  const room = limit - smsLength(`${opts.prefix}${cutJoin}${footer}`, ucs2) - 3;
  const cut = [...trimmed].slice(0, Math.max(room, 0)).join('').trimEnd();
  return `${cut}...${cutJoin}${footer}`;
}
