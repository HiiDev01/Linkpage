import { useEffect, useState } from 'react';
import { FiArrowDown, FiArrowUp, FiEdit2, FiExternalLink, FiPlus, FiTrash2 } from 'react-icons/fi';
import api, { errorMessage } from '../api.js';
import Field from '../components/Field.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import SocialLinks from '../components/SocialLinks.jsx';
import { useToast } from '../components/Toast.jsx';

const EMPTY = { title: '', url: '', description: '', icon: '', is_active: true };

function LinkForm({ initial, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ ...EMPTY, ...initial, description: initial?.description ?? '', icon: initial?.icon ?? '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    const body = { title: form.title, url: form.url, description: form.description, icon: form.icon, is_active: form.is_active };
    try {
      if (initial?.id) await api.put(`/links/${initial.id}`, body); else await api.post('/links', body);
      toast(initial?.id ? 'Link saved' : 'Link added');
      onSaved();
    } catch (err) {
      const f = err.response?.data?.field;
      if (f) setErrors({ [f]: errorMessage(err) }); else toast(errorMessage(err), 'error');
      setBusy(false);
    }
  };

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="link-form-title">
      <form className="modal wide" onSubmit={submit} noValidate>
        <h2 id="link-form-title">{initial?.id ? 'Edit link' : 'Add a link'}</h2>
        <Field label="Title" value={form.title} onChange={set('title')} error={errors.title} placeholder="My latest video" autoFocus />
        <Field label="URL" type="url" value={form.url} onChange={set('url')} error={errors.url} placeholder="https://" />
        <Field label="Description (optional)" value={form.description} onChange={set('description')} error={errors.description} maxLength={200} />
        <Field label="Emoji icon (optional)" value={form.icon} onChange={set('icon')} error={errors.icon} maxLength={8} placeholder="🎬" />
        <label className="check"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Show this link on my page</label>
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save link'}</button>
        </div>
      </form>
    </div>
  );
}

export default function LinksPage() {
  const toast = useToast();
  const [links, setLinks] = useState(null);
  const [editing, setEditing] = useState(null); // null | {} (new) | link
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setLinks((await api.get('/links')).data.links); }
    catch (err) { toast(errorMessage(err), 'error'); setLinks([]); }
  };
  useEffect(() => { load(); }, []);

  const move = async (index, dir) => {
    const next = [...links];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setLinks(next); // optimistic
    try { await api.patch('/links/reorder', { ids: next.map((l) => l.id) }); }
    catch (err) { toast(errorMessage(err), 'error'); load(); }
  };

  const toggle = async (l) => {
    const body = { title: l.title, url: l.url, description: l.description || '', icon: l.icon || '', is_active: !l.is_active };
    setLinks(links.map((x) => (x.id === l.id ? { ...x, is_active: !l.is_active } : x)));
    try { await api.put(`/links/${l.id}`, body); }
    catch (err) { toast(errorMessage(err), 'error'); load(); }
  };

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/links/${deleting.id}`); toast('Link deleted'); setDeleting(null); await load(); }
    catch (err) { toast(errorMessage(err), 'error'); }
    setBusy(false);
  };

  return (
    <>
      <div className="row between">
        <h1>Links</h1>
        <button className="btn" onClick={() => setEditing({})}><FiPlus /> Add link</button>
      </div>

      {links === null ? <div className="spinner" aria-label="Loading" /> : links.length === 0 ? (
        <div className="panel empty">
          <h2>No links yet</h2>
          <p className="muted">Add your first link: a video, a shop, a booking page, anything you want people to open.</p>
          <button className="btn" onClick={() => setEditing({})}><FiPlus /> Add your first link</button>
        </div>
      ) : (
        <ul className="list">
          {links.map((l, i) => (
            <li key={l.id} className={`item ${l.is_active ? '' : 'off'}`}>
              <div className="reorder">
                <button className="icon-btn sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${l.title} up`}><FiArrowUp /></button>
                <button className="icon-btn sm" onClick={() => move(i, 1)} disabled={i === links.length - 1} aria-label={`Move ${l.title} down`}><FiArrowDown /></button>
              </div>
              <div className="item-main">
                <strong>{l.icon ? `${l.icon} ` : ''}{l.title}</strong>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="small muted">{l.url} <FiExternalLink /></a>
                {l.description && <span className="small muted">{l.description}</span>}
              </div>
              <label className="switch" title={l.is_active ? 'Visible' : 'Hidden'}>
                <input type="checkbox" checked={l.is_active} onChange={() => toggle(l)} aria-label={`Show ${l.title} on my page`} />
                <span />
              </label>
              <button className="icon-btn sm" onClick={() => setEditing(l)} aria-label={`Edit ${l.title}`}><FiEdit2 /></button>
              <button className="icon-btn sm" onClick={() => setDeleting(l)} aria-label={`Delete ${l.title}`}><FiTrash2 /></button>
            </li>
          ))}
        </ul>
      )}

      <SocialLinks />

      {editing && <LinkForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {deleting && (
        <ConfirmDialog title="Delete this link?" message={`“${deleting.title}” will be removed from your page. This can’t be undone.`}
          onConfirm={remove} onCancel={() => setDeleting(null)} busy={busy} />
      )}
    </>
  );
}
