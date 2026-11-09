import { useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../auth.jsx';
import Field from '../components/Field.jsx';
import { useToast } from '../components/Toast.jsx';

const FIELDS = ['full_name', 'username', 'professional_title', 'bio', 'location', 'contact_email', 'phone', 'website'];

export default function ProfileEditor() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uname, setUname] = useState('');

  useEffect(() => {
    if (profile && !form) setForm(Object.fromEntries(FIELDS.map((k) => [k, profile[k] ?? ''])));
  }, [profile, form]);

  // Live username check (skips the user's current name)
  useEffect(() => {
    if (!form || !profile) return;
    const u = form.username.trim().toLowerCase();
    if (u === profile.username) return setUname('');
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/username-available/${encodeURIComponent(u)}`);
        setUname(data.available ? '' : data.reason);
      } catch { setUname(''); }
    }, 400);
    return () => clearTimeout(t);
  }, [form?.username, profile]);

  if (!form) return <div className="spinner" aria-label="Loading" />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (uname) return setErrors({ username: uname });
    setSaving(true); setErrors({});
    try {
      await api.put('/profile/me', form);
      await refreshProfile();
      toast('Profile saved');
    } catch (err) {
      const f = err.response?.data?.field;
      if (f) setErrors({ [f]: errorMessage(err) }); else toast(errorMessage(err), 'error');
    }
    setSaving(false);
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast('Use a JPG, PNG or WebP image.', 'error');
    if (file.size > 2 * 1024 * 1024) return toast('Photo must be 2 MB or smaller.', 'error');
    setUploading(true);
    try {
      await api.post('/profile/avatar', file, { headers: { 'Content-Type': file.type } });
      await refreshProfile();
      toast('Photo updated');
    } catch (err) { toast(errorMessage(err), 'error'); }
    setUploading(false);
  };

  const initials = (profile.full_name || profile.username || '?').slice(0, 1).toUpperCase();

  return (
    <>
      <h1>Profile</h1>
      <p className="muted">This is what visitors see at the top of your page.</p>

      <section className="panel avatar-row">
        {profile.profile_image
          ? <img className="avatar" src={profile.profile_image} alt="Your profile photo" />
          : <div className="avatar placeholder" aria-hidden="true">{initials}</div>}
        <div>
          <button type="button" className="btn ghost" onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : profile.profile_image ? 'Change photo' : 'Upload photo'}
          </button>
          <p className="muted small">JPG, PNG or WebP, up to 2 MB.</p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} />
        </div>
      </section>

      <form className="panel" onSubmit={save} noValidate>
        <Field label="Full name" value={form.full_name} onChange={set('full_name')} error={errors.full_name} autoComplete="name" />
        <Field label="Username" value={form.username} onChange={set('username')}
          error={errors.username || uname} hint={`Your page: ${window.location.origin}/${form.username.toLowerCase()}`} />
        <Field label="Professional title" value={form.professional_title} onChange={set('professional_title')}
          error={errors.professional_title} placeholder="Product designer" />
        <Field as="textarea" rows={4} label="Short bio" value={form.bio} onChange={set('bio')} error={errors.bio}
          hint={`${form.bio.length}/500`} maxLength={500} />
        <Field label="Location (optional)" value={form.location} onChange={set('location')} error={errors.location} />
        <Field label="Contact email" type="email" value={form.contact_email} onChange={set('contact_email')} error={errors.contact_email}
          hint="Shown on your public page. Can differ from your login email." />
        <Field label="Phone (optional)" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <Field label="Website" type="url" value={form.website} onChange={set('website')} error={errors.website} placeholder="https://yoursite.com" />
        <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
    </>
  );
}
