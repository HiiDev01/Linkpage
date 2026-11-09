// Dependency-free SVG chart: bars = views, line = clicks.
const W = 640, H = 230, PL = 34, PR = 8, PT = 10, PB = 26;

const fmt = (day) => new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function DailyChart({ data }) {
  const n = data.length;
  const max = Math.max(1, ...data.flatMap((d) => [d.views, d.clicks]));
  const top = max <= 4 ? max : Math.ceil(max / 4) * 4; // tidy axis ceiling
  const plotW = W - PL - PR, plotH = H - PT - PB;
  const step = plotW / n;
  const x = (i) => PL + step * i + step / 2;
  const y = (v) => PT + plotH - (v / top) * plotH;
  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((top / 4) * i * 100) / 100).filter((v, i, a) => a.indexOf(v) === i);
  const labelAt = new Set([0, Math.floor((n - 1) / 2), n - 1]);
  const sumV = data.reduce((s, d) => s + d.views, 0), sumC = data.reduce((s, d) => s + d.clicks, 0);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Daily views and clicks over ${n} days: ${sumV} views and ${sumC} clicks in total.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} className="grid" />
            <text x={PL - 6} y={y(t) + 4} textAnchor="end" className="axis">{t}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <rect key={d.day} x={x(i) - Math.max(1.5, step * 0.32)} width={Math.max(3, step * 0.64)} y={y(d.views)} height={plotH - (y(d.views) - PT)} rx="2" className="bar">
            <title>{`${fmt(d.day)}: ${d.views} views, ${d.clicks} clicks`}</title>
          </rect>
        ))}
        <polyline className="line" fill="none" points={data.map((d, i) => `${x(i)},${y(d.clicks)}`).join(' ')} />
        {n <= 31 && data.map((d, i) => <circle key={d.day} cx={x(i)} cy={y(d.clicks)} r="2.6" className="dot" />)}
        {data.map((d, i) => labelAt.has(i) && (
          <text key={d.day} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="axis">{fmt(d.day)}</text>
        ))}
      </svg>
      <div className="legend"><span><i className="sw bar-sw" /> Views</span><span><i className="sw line-sw" /> Clicks</span></div>
    </div>
  );
}
