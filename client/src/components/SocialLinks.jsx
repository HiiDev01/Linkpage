import { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import api, { errorMessage } from '../api.js';
import { PLATFORMS } from './platforms.js';
import Field from './Field.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { useToast } from './Toast.jsx';

function SocialForm({ initial, used, onClose, onSaved }) {
  const toast = useToast();
  const available = Object.keys(PLATFORMS).filter((p) => p === initial?.platform || !used.includes(p));
  const [form, setForm] = useState({ platform: initial?.platform || available[0], url: initial?.url || '', is_visible: initial?.is_visible ?? true });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      if (initial?.id) await api.put(`/social-links/${initial.id}`, form); else await api.post('/social-links', form);
      toast(initial?.id ? 'Social link saved' : 'Social link added');
      onSaved();
    } catch (err) {
      const f = err.response?.data?.field;
      if (f) setErrors({ [f]: errorMessage(err) }); else toast(errorMessage(err), 'error');
      setBusy(false);
    }
  };

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="social-form-title">
      <form className="modal wide" onSubmit={submit} noValidate>
        <h2 id="social-form-title">{initial?.id ? 'Edit social link' : 'Add a social link'}</h2>
        <Field as="select" label="Platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} error={errors.platform}>
          {available.map((p) => <option key={p} value={p}>{PLATFORMS[p].label}</option>)}
        </Field>
        <Field label="Profile URL" type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
          error={errors.url} placeholder={PLATFORMS[form.platform].placeholder} autoFocus />
        <label className="check"><input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} /> Show this icon on my page</label>
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

export default function SocialLinks() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setItems((await api.get('/social-links')).data.social_links); }
    catch (err) { toast(errorMessage(err), 'error'); setItems([]); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (s) => {
    setItems(items.map((x) => (x.id === s.id ? { ...x, is_visible: !s.is_visible } : x)));
    try { await api.put(`/social-links/${s.id}`, { platform: s.platform, url: s.url, is_visible: !s.is_visible }); }
    catch (err) { toast(errorMessage(err), 'error'); load(); }
  };

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/social-links/${deleting.id}`); toast('Social link deleted'); setDeleting(null); await load(); }
    catch (err) { toast(errorMessage(err), 'error'); }
    setBusy(false);
  };

  const used = (items || []).map((s) => s.platform);
  const allUsed = used.length >= Object.keys(PLATFORMS).length;

  return (
    <>
      <div className="row between section-gap">
        <h2>Social links</h2>
        <button className="btn ghost" onClick={() => setEditing({})} disabled={allUsed}><FiPlus /> Add social link</button>
      </div>
      {items === null ? <div className="spinner" aria-label="Loading" /> : items.length === 0 ? (
        <div className="panel empty">
          <p className="muted">Add your Instagram, LinkedIn, GitHub and more. They show as icons under your name.</p>
        </div>
      ) : (
        <ul className="list">
          {items.map((s) => {
            const P = PLATFORMS[s.platform];
            return (
              <li key={s.id} className={`item ${s.is_visible ? '' : 'off'}`}>
                <span className="plat"><P.icon /></span>
                <div className="item-main">
                  <strong>{P.label}</strong>
                  <span className="small muted">{s.url}</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={s.is_visible} onChange={() => toggle(s)} aria-label={`Show ${P.label} on my page`} />
                  <span />
                </label>
                <button className="icon-btn sm" onClick={() => setEditing(s)} aria-label={`Edit ${P.label}`}><FiEdit2 /></button>
                <button className="icon-btn sm" onClick={() => setDeleting(s)} aria-label={`Delete ${P.label}`}><FiTrash2 /></button>
              </li>
            );
          })}
        </ul>
      )}
      {editing && <SocialForm initial={editing} used={used} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {deleting && (
        <ConfirmDialog title="Delete this social link?" message={`${PLATFORMS[deleting.platform].label} will be removed from your page.`}
          onConfirm={remove} onCancel={() => setDeleting(null)} busy={busy} />
      )}
    </>
  );
}
