import { useEffect, useMemo, useState } from 'react';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../auth.jsx';
import ProfileView from '../components/ProfileView.jsx';
import { useToast } from '../components/Toast.jsx';
import { PRESETS, fromPreset, pickTheme } from '../themes.js';

function Segmented({ label, value, options, onChange }) {
  return (
    <div className="seg-group" role="group" aria-label={label}>
      <span className="seg-label">{label}</span>
      <div className="seg">
        {options.map(([v, text]) => (
          <button key={v} type="button" aria-pressed={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{text}</button>
        ))}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <span className="color-box"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} /><code>{value}</code></span>
    </label>
  );
}

export default function ThemeEditor() {
  const { profile } = useAuth();
  const toast = useToast();
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [data, setData] = useState({ links: [], socials: [], projects: [] });
  const [view, setView] = useState('edit');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [t, l, s, p] = await Promise.all([api.get('/themes'), api.get('/links'), api.get('/social-links'), api.get('/portfolio')]);
        const theme = pickTheme(t.data.theme);
        setSaved(theme); setDraft(theme);
        setData({ links: l.data.links, socials: s.data.social_links, projects: p.data.projects });
      } catch (err) { toast(errorMessage(err), 'error'); }
    })();
  }, []);

  const dirty = useMemo(() => saved && draft && JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);
  if (!draft || !profile) return <div className="spinner" aria-label="Loading" />;

  const set = (k) => (v) => setDraft({ ...draft, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      const { data: res } = await api.put('/themes', draft);
      const t = pickTheme(res.theme);
      setSaved(t); setDraft(t);
      toast('Appearance saved');
    } catch (err) { toast(errorMessage(err), 'error'); }
    setSaving(false);
  };

  return (
    <>
      <div className="row between">
        <h1>Appearance</h1>
        <div className="row">
          <button className="btn ghost" onClick={() => setDraft(saved)} disabled={!dirty || saving}>Discard changes</button>
          <button className="btn" onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save appearance'}</button>
        </div>
      </div>

      <div className="tabs only-narrow" role="tablist">
        <button role="tab" aria-selected={view === 'edit'} className={view === 'edit' ? 'on' : ''} onClick={() => setView('edit')}>Customize</button>
        <button role="tab" aria-selected={view === 'preview'} className={view === 'preview' ? 'on' : ''} onClick={() => setView('preview')}>Preview</button>
      </div>

      <div className="tp-grid">
        <div className={`tp-controls ${view === 'edit' ? 'show' : ''}`}>
          <section className="panel">
            <h2>Start from a theme</h2>
            <div className="presets">
              {Object.entries(PRESETS).map(([name, p]) => (
                <button key={name} type="button" className={`preset ${draft.preset === name ? 'on' : ''}`} onClick={() => setDraft(fromPreset(name))} aria-pressed={draft.preset === name}>
                  <span className="swatch" style={{ background: p.background_color }}><i style={{ background: p.button_color }} /></span>
                  {p.label}
                </button>
              ))}
            </div>
            <p className="muted small">Picking a theme replaces your current settings. You can adjust anything after.</p>
          </section>

          <section className="panel">
            <h2>Colors</h2>
            <div className="colors">
              <ColorField label="Background" value={draft.background_color} onChange={set('background_color')} />
              <ColorField label="Text" value={draft.text_color} onChange={set('text_color')} />
              <ColorField label="Buttons" value={draft.button_color} onChange={set('button_color')} />
            </div>
          </section>

          <section className="panel">
            <h2>Style</h2>
            <Segmented label="Button shape" value={draft.button_style} onChange={set('button_style')}
              options={[['rounded', 'Rounded'], ['pill', 'Pill'], ['square', 'Square'], ['outline', 'Outline']]} />
            <Segmented label="Link cards" value={draft.link_card_style} onChange={set('link_card_style')}
              options={[['filled', 'Filled'], ['outline', 'Outline'], ['shadow', 'Shadow']]} />
            <Segmented label="Font" value={draft.font_family} onChange={set('font_family')}
              options={[['sans', 'Sans'], ['serif', 'Serif'], ['mono', 'Mono'], ['display', 'Display']]} />
            <Segmented label="Profile image" value={draft.profile_image_shape} onChange={set('profile_image_shape')}
              options={[['circle', 'Circle'], ['rounded', 'Rounded'], ['square', 'Square']]} />
            <Segmented label="Page layout" value={draft.layout_style} onChange={set('layout_style')}
              options={[['card', 'Card'], ['flat', 'Flat'], ['glass', 'Glass']]} />
          </section>
        </div>

        <div className={`tp-preview ${view === 'preview' ? 'show' : ''}`}>
          <div className="phone" aria-label="Live preview of your page">
            <ProfileView preview profile={profile} theme={draft} links={data.links} socials={data.socials} projects={data.projects} />
          </div>
          <p className="muted small center">Live preview. Changes go public only after you save and publish.</p>
        </div>
      </div>
    </>
  );
}
