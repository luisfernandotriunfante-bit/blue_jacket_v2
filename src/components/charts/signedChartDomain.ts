export function signedChartDomain(values: number[]) {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const pad = (max - min) * 0.12 || 1;
  return { min: min < 0 ? min - pad : 0, max: max + pad };
}
