type Props = { label: string; value: string; desc?: string; tone?: 'blue' | 'green' | 'dark' };
export function KpiCard({ label, value, desc, tone='blue' }: Props) {
  return <div className={`kpi-card ${tone}`}><span>{label}</span><strong>{value}</strong>{desc && <small>{desc}</small>}</div>;
}
