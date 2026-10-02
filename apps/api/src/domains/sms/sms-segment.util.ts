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
