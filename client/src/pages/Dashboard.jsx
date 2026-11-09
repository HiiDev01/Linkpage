import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import SharePanel from '../components/SharePanel.jsx';
import { useAuth } from '../auth.jsx';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [linkCount, setLinkCount] = useState(null);
  const [themed, setThemed] = useState(false);
  useEffect(() => { api.get('/links').then((r) => setLinkCount(r.data.links.length)).catch(() => {}); }, []);
  useEffect(() => {
    api.get('/themes').then((r) => {
      const t = r.data.theme;
      setThemed(t.preset !== 'light' || t.button_color !== '#3b4bff' || t.background_color !== '#ffffff' || t.button_style !== 'rounded');
    }).catch(() => {});
  }, []);
  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const url = `${window.location.origin}/${profile?.username}`;

  const steps = [
    { done: !!profile?.professional_title && !!profile?.bio, label: 'Finish your profile', to: '/dashboard/profile' },
    { done: linkCount > 0, label: 'Add your first link', to: '/dashboard/links' },
    { done: themed, label: 'Choose a look', to: '/dashboard/appearance' },
    { done: profile?.is_published, label: 'Publish your page', to: '/dashboard' },
  ];

  return (
    <>
      <h1>Welcome, {firstName}</h1>
      <p className="muted">Signed in as {user?.email}</p>

      <SharePanel />

      <section className="panel">
        <h2>Get set up</h2>
        <ul className="checklist">
          {steps.map((s) => (
            <li key={s.label} className={s.done ? 'done' : ''}>
              <span className="tick" aria-hidden="true">{s.done ? '✓' : ''}</span>
              <Link to={s.to}>{s.label}</Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
