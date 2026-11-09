import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api.js';
import ProfileView from '../components/ProfileView.jsx';
import NotFound from './NotFound.jsx';

export default function PublicProfile() {
  const { username } = useParams();
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    api.get(`/profile/${encodeURIComponent(username)}`)
      .then((r) => { if (!cancelled) setState({ status: 'ok', ...r.data }); })
      .catch((e) => { if (!cancelled) setState({ status: e.response?.status === 404 ? 'missing' : 'error' }); });
    return () => { cancelled = true; };
  }, [username]);

  // Count one view per browser session. Nothing about the visitor is sent beyond the username.
  useEffect(() => {
    if (state.status !== 'ok') return;
    const key = `lp_view_${state.profile.username}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch { /* storage blocked: count anyway */ }
    api.post('/analytics/view', { username: state.profile.username }).catch(() => {});
  }, [state]);

  useEffect(() => {
    if (state.status !== 'ok') return;
    const p = state.profile;
    document.title = `${p.full_name || p.username}${p.professional_title ? `, ${p.professional_title}` : ''} | LinkPage`;
    return () => { document.title = 'LinkPage: everything you are, one link'; };
  }, [state]);

  if (state.status === 'loading') return <div className="center-screen"><div className="spinner" aria-label="Loading" /></div>;
  if (state.status === 'missing') return <NotFound message="This page doesn’t exist or isn’t published yet." />;
  if (state.status === 'error') return <NotFound code="Oops" message="We couldn’t load this page. Try again in a moment." />;

  return (
    <div className="pv-page">
      <ProfileView profile={state.profile} theme={state.theme} links={state.links} socials={state.social_links} projects={state.projects}
        onLinkClick={(l) => api.post('/analytics/click', { link_id: l.id }).catch(() => {})} />
    </div>
  );
}
