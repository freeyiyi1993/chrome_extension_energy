export function parseTimeStr(timeStr: string | null): number {
  if (!timeStr) return 24;
  const [h, p] = timeStr.split(' ');
  let hour24 = parseInt(h);
  if (p === 'PM' && hour24 !== 12) hour24 += 12;
  if (p === 'AM' && hour24 === 12) hour24 = 0;
  return hour24;
}
