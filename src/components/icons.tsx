type IconProps = { size?: number };
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function IconGrid({ size = 18 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
}
export function IconBars({ size = 18 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base}><line x1="4" y1="20" x2="4" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="20" y1="20" x2="20" y2="14" /></svg>;
}
export function IconBox({ size = 18 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>;
}
export function IconPulse({ size = 18 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M3 12h4l2-7 4 14 2-7h6" /></svg>;
}
export function IconUsers({ size = 18 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" /><circle cx="17.5" cy="9" r="2.6" /><path d="M15.5 14.2c2.6.3 4.5 2.5 4.5 5.8" /></svg>;
}
export function IconDoc({ size = 18 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /><line x1="9" y1="13" x2="16" y2="13" /><line x1="9" y1="17" x2="16" y2="17" /></svg>;
}
export function IconGear({ size = 18 }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="3" /><path d="M19.4 13a7.8 7.8 0 000-2l2-1.6-2-3.4-2.4 1a7.8 7.8 0 00-1.7-1L15 3h-6l-.3 2.4a7.8 7.8 0 00-1.7 1l-2.4-1-2 3.4L4.6 11a7.8 7.8 0 000 2l-2 1.6 2 3.4 2.4-1a7.8 7.8 0 001.7 1L9 21h6l.3-2.4a7.8 7.8 0 001.7-1l2.4 1 2-3.4z" /></svg>;
}
