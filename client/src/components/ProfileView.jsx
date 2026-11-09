import { FiExternalLink, FiGlobe, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { PLATFORMS } from './platforms.js';
import './profileview.css';

const FONTS = {
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  display: "'Bricolage Grotesque', system-ui, sans-serif",
};

const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : undefined);

// Pick black or white text for a given background hex.
function readableOn(hex) {
  const n = parseInt((hex || '#000000').slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? '#111111' : '#ffffff';
}

/**
 * Renders a LinkPage. Used for the live preview now and the public page in Stage 4.
 * Pass `preview` to disable link navigation, or `onLinkClick(link)` to track clicks.
 */
export default function ProfileView({ profile, theme, links = [], socials = [], projects = [], preview = false, onLinkClick }) {
  const t = theme;
  const shownLinks = links.filter((l) => l.is_active);
  const shownSocials = socials.filter((s) => s.is_visible);
  const gradient = t.preset === 'gradient';

  const style = {
    '--pv-bg': t.background_color,
    '--pv-text': t.text_color,
    '--pv-btn': t.button_color,
    '--pv-btn-text': readableOn(t.button_color),
    '--pv-font': FONTS[t.font_family],
    background: gradient
      ? `linear-gradient(160deg, ${t.background_color}, color-mix(in srgb, ${t.background_color} 55%, #ff6ec7))`
      : t.background_color,
  };

  const guard = (e, link) => {
    if (preview) return e.preventDefault();
    onLinkClick?.(link);
  };
  const initial = (profile.full_name || profile.username || '?').slice(0, 1).toUpperCase();

  return (
    <div className={`pv pv-btn-${t.button_style} pv-card-${t.link_card_style} pv-layout-${t.layout_style} pv-shape-${t.profile_image_shape}`} style={style}>
      <div className="pv-inner">
        <header className="pv-head">
          {profile.profile_image
            ? <img className="pv-avatar" src={profile.profile_image} alt={profile.full_name ? `${profile.full_name}’s photo` : 'Profile photo'} />
            : <div className="pv-avatar pv-avatar-empty" aria-hidden="true">{initial}</div>}
          <h1>{profile.full_name || `@${profile.username}`}</h1>
          {profile.professional_title && <p className="pv-title">{profile.professional_title}</p>}
          {profile.bio && <p className="pv-bio">{profile.bio}</p>}
          {profile.location && <p className="pv-loc"><FiMapPin aria-hidden="true" /> {profile.location}</p>}
        </header>

        {shownSocials.length > 0 && (
          <div className="pv-socials">
            {shownSocials.map((s) => {
              const P = PLATFORMS[s.platform];
              return P && (
                <a key={s.id} href={safeUrl(s.url)} target="_blank" rel="noopener noreferrer nofollow" aria-label={P.label}
                  onClick={(e) => preview && e.preventDefault()}><P.icon /></a>
              );
            })}
          </div>
        )}

        {shownLinks.length > 0 && (
          <nav className="pv-links" aria-label="Links">
            {shownLinks.map((l) => (
              <a key={l.id} className="pv-link" href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer nofollow" onClick={(e) => guard(e, l)}>
                {l.icon && <span className="pv-link-icon" aria-hidden="true">{l.icon}</span>}
                <span className="pv-link-text"><strong>{l.title}</strong>{l.description && <small>{l.description}</small>}</span>
              </a>
            ))}
          </nav>
        )}

        {projects.length > 0 && (
          <section className="pv-section">
            <h2>Work</h2>
            <div className="pv-projects">
              {projects.map((p) => (
                <article key={p.id} className="pv-project">
                  {p.image_url && <img src={p.image_url} alt="" loading="lazy" />}
                  <div className="pv-project-body">
                    <h3>{p.title}</h3>
                    {p.description && <p>{p.description}</p>}
                    {p.technologies?.length > 0 && <ul>{p.technologies.map((x) => <li key={x}>{x}</li>)}</ul>}
                    {safeUrl(p.project_url) && (
                      <a href={p.project_url} target="_blank" rel="noopener noreferrer nofollow" onClick={(e) => preview && e.preventDefault()}>
                        View project <FiExternalLink aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {(profile.contact_email || profile.phone || profile.website) && (
          <section className="pv-section">
            <h2>Contact</h2>
            <ul className="pv-contact">
              {profile.contact_email && <li><FiMail aria-hidden="true" /> <a href={`mailto:${profile.contact_email}`} onClick={(e) => preview && e.preventDefault()}>{profile.contact_email}</a></li>}
              {profile.phone && <li><FiPhone aria-hidden="true" /> <a href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`} onClick={(e) => preview && e.preventDefault()}>{profile.phone}</a></li>}
              {safeUrl(profile.website) && <li><FiGlobe aria-hidden="true" /> <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow" onClick={(e) => preview && e.preventDefault()}>{profile.website.replace(/^https?:\/\//, '')}</a></li>}
            </ul>
          </section>
        )}

        {shownLinks.length === 0 && shownSocials.length === 0 && projects.length === 0 && preview && (
          <p className="pv-hint">Add links, social icons or projects and they’ll appear here.</p>
        )}

        <footer className="pv-foot">
          <a href="/" onClick={(e) => preview && e.preventDefault()}>Made with LinkPage</a>
        </footer>
      </div>
    </div>
  );
}
