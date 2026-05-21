const VN_TZ = 'Asia/Ho_Chi_Minh';
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getVietnamDateParts(date: Date): { year: number; month: number; day: number } {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);

  return { year, month, day };
}

/** Returns the UTC Date range that corresponds to the VN local calendar day. */
export function getVietnamDayRangeUtc(date: Date): { startUtc: Date; endUtc: Date; vnDate: string } {
  const { year, month, day } = getVietnamDateParts(date);

  // VN local midnight is UTC-7 hours
  const vnMidnightUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - VN_OFFSET_MS;
  const startUtc = new Date(vnMidnightUtcMs);
  const endUtc = new Date(vnMidnightUtcMs + 24 * 60 * 60 * 1000 - 1);

  const vnDate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { startUtc, endUtc, vnDate };
}

