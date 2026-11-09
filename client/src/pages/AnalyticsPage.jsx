import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import DailyChart from '../components/DailyChart.jsx';
import { useToast } from '../components/Toast.jsx';

const RANGES = [7, 30, 90];

export default function AnalyticsPage() {
  const toast = useToast();
  const [days, setDays] = useState(30);
  const [ov, setOv] = useState(null);
  const [lk, setLk] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stale = false;
    setOv(null); setFailed(false);
    Promise.all([
      api.get('/analytics/overview', { params: { days, tz: new Date().getTimezoneOffset() } }),
      api.get('/analytics/links', { params: { days } }),
    ]).then(([a, b]) => { if (!stale) { setOv(a.data); setLk(b.data); } })
      .catch((e) => { if (!stale) { setFailed(true); toast(errorMessage(e), 'error'); } });
    return () => { stale = true; };
  }, [days]);

  const header = (
    <div className="row between">
      <h1>Analytics</h1>
      <div className="seg" role="group" aria-label="Date range">
        {RANGES.map((r) => <button key={r} className={days === r ? 'on' : ''} aria-pressed={days === r} onClick={() => setDays(r)}>{r} days</button>)}
      </div>
    </div>
  );

  if (failed) return <>{header}<div className="panel empty"><h2>Couldn’t load analytics</h2><p className="muted">Try refreshing the page.</p></div></>;
  if (!ov || !lk) return <>{header}<div className="spinner" aria-label="Loading" /></>;

  if (ov.totals.views === 0 && ov.totals.clicks === 0) {
    return (
      <>
        {header}
        <div className="panel empty">
          <h2>No visits yet</h2>
          <p className="muted">Publish your page and share your link. Views and clicks show up here.</p>
          <Link className="btn" to="/dashboard">Go to publish</Link>
        </div>
      </>
    );
  }

  const rate = ov.range.views ? Math.round((ov.range.clicks / ov.range.views) * 100) : 0;
  const maxClicks = Math.max(1, ...lk.links.map((l) => l.clicks));

  return (
    <>
      {header}
      <div className="stats">
        <div className="stat"><span className="muted">Profile views</span><strong>{ov.range.views}</strong><small className="muted">{ov.totals.views} all time</small></div>
        <div className="stat"><span className="muted">Link clicks</span><strong>{ov.range.clicks}</strong><small className="muted">{ov.totals.clicks} all time</small></div>
        <div className="stat"><span className="muted">Clicks per 100 views</span><strong>{rate}</strong><small className="muted">last {days} days</small></div>
      </div>

      <section className="panel">
        <h2>Views and clicks per day</h2>
        <DailyChart data={ov.daily} />
      </section>

      <section className="panel">
        <h2>Most clicked links</h2>
        {lk.links.length === 0 ? <p className="muted">You haven’t added any links yet.</p> : (
          <ul className="bars">
            {lk.links.map((l) => (
              <li key={l.link_id}>
                <div className="bar-top"><strong>{l.title}</strong><span>{l.clicks}</span></div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(l.clicks / maxClicks) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>Recent clicks</h2>
        {lk.recent.length === 0 ? <p className="muted">No clicks yet.</p> : (
          <ul className="recent">
            {lk.recent.map((r, i) => (
              <li key={i}><span>{r.title}</span><time dateTime={r.created_at} className="muted">{new Date(r.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time></li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
