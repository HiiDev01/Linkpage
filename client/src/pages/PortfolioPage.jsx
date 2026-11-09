import { useEffect, useRef, useState } from 'react';
import { FiEdit2, FiExternalLink, FiImage, FiPlus, FiTrash2 } from 'react-icons/fi';
import api, { errorMessage } from '../api.js';
import Field from '../components/Field.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../components/Toast.jsx';

function ProjectForm({ initial, onClose, onSaved }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    title: initial?.title || '', description: initial?.description || '', image_url: initial?.image_url || '',
    project_url: initial?.project_url || '', technologies: (initial?.technologies || []).join(', '),
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast('Use a JPG, PNG or WebP image.', 'error');
    if (file.size > 5 * 1024 * 1024) return toast('Image must be 5 MB or smaller.', 'error');
    setUploading(true);
    try {
      const { data } = await api.post('/portfolio/image', file, { headers: { 'Content-Type': file.type } });
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch (err) { toast(errorMessage(err), 'error'); }
    setUploading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    const body = { ...form, technologies: form.technologies.split(',').map((t) => t.trim()).filter(Boolean) };
    try {
      if (initial?.id) await api.put(`/portfolio/${initial.id}`, body); else await api.post('/portfolio', body);
      toast(initial?.id ? 'Project saved' : 'Project added');
      onSaved();
    } catch (err) {
      const f = err.response?.data?.field;
      if (f) setErrors({ [f]: errorMessage(err) }); else toast(errorMessage(err), 'error');
      setBusy(false);
    }
  };

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="project-form-title">
      <form className="modal wide" onSubmit={submit} noValidate>
        <h2 id="project-form-title">{initial?.id ? 'Edit project' : 'Add a project'}</h2>
        <div className="thumb-row">
          {form.image_url ? <img className="thumb" src={form.image_url} alt="Project preview" /> : <div className="thumb empty"><FiImage /></div>}
          <div>
            <button type="button" className="btn ghost" onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : form.image_url ? 'Change image' : 'Upload image'}
            </button>
            {form.image_url && <button type="button" className="btn ghost" onClick={() => setForm({ ...form, image_url: '' })}>Remove</button>}
            <p className="muted small">JPG, PNG or WebP, up to 5 MB.</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} />
          </div>
        </div>
        <Field label="Project title" value={form.title} onChange={set('title')} error={errors.title} autoFocus />
        <Field as="textarea" rows={3} label="Description (optional)" value={form.description} onChange={set('description')} error={errors.description} maxLength={1000} />
        <Field label="Project URL (optional)" type="url" value={form.project_url} onChange={set('project_url')} error={errors.project_url} placeholder="https://" />
        <Field label="Technologies (optional)" value={form.technologies} onChange={set('technologies')} error={errors.technologies} hint="Separate with commas: React, Node, Figma" />
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn" disabled={busy || uploading}>{busy ? 'Saving…' : 'Save project'}</button>
        </div>
      </form>
    </div>
  );
}

export default function PortfolioPage() {
  const toast = useToast();
  const [projects, setProjects] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setProjects((await api.get('/portfolio')).data.projects); }
    catch (err) { toast(errorMessage(err), 'error'); setProjects([]); }
  };
  useEffect(() => { load(); }, []);

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/portfolio/${deleting.id}`); toast('Project deleted'); setDeleting(null); await load(); }
    catch (err) { toast(errorMessage(err), 'error'); }
    setBusy(false);
  };

  return (
    <>
      <div className="row between">
        <h1>Portfolio</h1>
        <button className="btn" onClick={() => setEditing({})}><FiPlus /> Add project</button>
      </div>
      <p className="muted">Show your best work in a “Work” section on your page.</p>

      {projects === null ? <div className="spinner" aria-label="Loading" /> : projects.length === 0 ? (
        <div className="panel empty">
          <h2>No projects yet</h2>
          <p className="muted">Add a project with a picture, a short description and a link.</p>
          <button className="btn" onClick={() => setEditing({})}><FiPlus /> Add your first project</button>
        </div>
      ) : (
        <ul className="list">
          {projects.map((p) => (
            <li key={p.id} className="item">
              {p.image_url ? <img className="thumb sm" src={p.image_url} alt="" /> : <div className="thumb sm empty"><FiImage /></div>}
              <div className="item-main">
                <strong>{p.title}</strong>
                {p.technologies?.length > 0 && <span className="small muted">{p.technologies.join(' · ')}</span>}
                {p.project_url && <a className="small muted" href={p.project_url} target="_blank" rel="noopener noreferrer">{p.project_url} <FiExternalLink /></a>}
              </div>
              <button className="icon-btn sm" onClick={() => setEditing(p)} aria-label={`Edit ${p.title}`}><FiEdit2 /></button>
              <button className="icon-btn sm" onClick={() => setDeleting(p)} aria-label={`Delete ${p.title}`}><FiTrash2 /></button>
            </li>
          ))}
        </ul>
      )}

      {editing && <ProjectForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {deleting && (
        <ConfirmDialog title="Delete this project?" message={`“${deleting.title}” will be removed from your page. This can’t be undone.`}
          onConfirm={remove} onCancel={() => setDeleting(null)} busy={busy} />
      )}
    </>
  );
}
