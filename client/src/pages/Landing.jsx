import { Link } from 'react-router-dom';
import { FiBarChart2, FiDroplet, FiGrid, FiLink, FiShield, FiSmartphone } from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import ThemeToggle from '../components/ThemeToggle.jsx';
import ProfileView from '../components/ProfileView.jsx';
import { PRESETS, fromPreset } from '../themes.js';

// Marketing-only sample data for the example phones. Real pages always load from Supabase.
const sample = (id, p) => ({
  profile: { id, username: p.username, full_name: p.name, professional_title: p.title, bio: p.bio, location: p.location || null, profile_image: null, contact_email: p.email || null, phone: null, website: null },
  links: p.links.map((t, i) => ({ id: `${id}-l${i}`, title: t[0], description: t[1] || null, icon: t[2] || null, url: 'https://example.com', is_active: true })),
  socials: ['instagram', 'github', 'linkedin'].slice(0, p.socials ?? 3).map((pl) => ({ id: `${id}-${pl}`, platform: pl, url: 'https://example.com', is_visible: true })),
  projects: p.projects || [],
});

const EXAMPLES = [
  { theme: 'dark', ...sample('a', { username: 'mira', name: 'Mira Okafor', title: 'Music producer', bio: 'Beats, remixes and sample packs.', location: 'Lagos', links: [['New EP: Night Shift', 'Out now', '🎧'], ['Sample pack', null, '📦'], ['Book a session', null, '📅']] }) },
  { theme: 'creative', ...sample('b', { username: 'sol', name: 'Sol Bakery', title: 'Sourdough & pastries', bio: 'Small-batch baking. Pickup Thursdays.', location: 'Leeds', links: [['Order this week’s box', null, '🥐'], ['Menu', null, '📖'], ['Find us', null, '📍']] }) },
  { theme: 'minimal', ...sample('c', { username: 'jonas', name: 'Jonas Reyes', title: 'Architect', bio: 'Housing, adaptive reuse, small public spaces.', links: [['Selected work'], ['Journal'], ['Contact']] }) },
];

const PORTFOLIO = sample('p', {
  username: 'dana', name: 'Dana Whitfield', title: 'Product designer', bio: 'Design systems and mobile apps.', socials: 2,
  links: [['Resume']],
  projects: [
    { id: 'p1', title: 'Ledger: budgeting app', description: 'Redesigned onboarding and cut drop-off by a third.', technologies: ['Figma', 'React Native'], project_url: 'https://example.com', image_url: null },
    { id: 'p2', title: 'Orbit design system', description: 'Components and tokens shared by six product teams.', technologies: ['Storybook', 'CSS'], project_url: 'https://example.com', image_url: null },
  ],
});

const FEATURES = [
  [FiLink, 'Unlimited links', 'Add, reorder, hide and edit as many links as you like.'],
  [FiGrid, 'Portfolio', 'Show projects with images, descriptions and the tools you used.'],
  [FiDroplet, 'Your look', 'Six themes, plus your own colors, fonts and button styles.'],
  [BsQrCode, 'QR code', 'Every published page gets a QR code you can download and print.'],
  [FiBarChart2, 'Simple analytics', 'See views and clicks. No visitor tracking beyond counts.'],
  [FiSmartphone, 'Built for phones', 'Fast, readable and tap-friendly on any screen.'],
];

const FAQ = [
  ['Is LinkPage free?', 'Yes. Creating a page, adding links and publishing it costs nothing.'],
  ['Can I change my username later?', 'Yes, as long as the new one is available. Your old address stops working when you change it.'],
  ['Who can see my page?', 'Nobody until you publish it. You can unpublish at any time and the link and QR code stop working right away.'],
  ['Do you track my visitors?', 'We count page views and link clicks so you can see what works. We don’t store visitor IP addresses or identities.'],
  ['Where do I put my link?', 'Anywhere that takes a URL: Instagram, TikTok and LinkedIn bios, email signatures, resumes, business cards (use the QR code).'],
];

function Phone({ themeName, data, tall }) {
  return (
    <div className={`phone mini ${tall ? 'tall' : ''}`} aria-hidden="true">
      <ProfileView preview profile={data.profile} theme={fromPreset(themeName)} links={data.links} socials={data.socials} projects={data.projects} />
    </div>
  );
}

export default function Landing() {
  return (
    <div className="landing">
      <header className="nav">
        <span className="brand">LinkPage</span>
        <nav className="row">
          <a className="nav-link" href="#how">How it works</a>
          <a className="nav-link" href="#faq">FAQ</a>
          <ThemeToggle />
          <Link className="btn ghost" to="/login">Log in</Link>
        </nav>
      </header>

      <section className="hero">
        <h1 className="display">Everything You Are. One Link.</h1>
        <p className="lead">Create your personal page, showcase your work, and share everything that matters with one simple link.</p>
        <div className="row wrap">
          <Link className="btn lg" to="/register">Create Your Free Page</Link>
          <a className="btn ghost lg" href="#examples">Explore Examples</a>
        </div>
      </section>

      <section className="block" id="how">
        <h2 className="h-section">How it works</h2>
        <ol className="steps">
          <li><strong>Sign up and pick a username.</strong> Your page lives at linkpage.com/yourname.</li>
          <li><strong>Add your links, work and details.</strong> Choose a theme and watch the preview update.</li>
          <li><strong>Publish and share.</strong> Paste the link in your bio, or print the QR code.</li>
        </ol>
      </section>

      <section className="block">
        <h2 className="h-section">Features</h2>
        <div className="features">
          {FEATURES.map(([Icon, title, text]) => (
            <div key={title} className="feature"><Icon aria-hidden="true" /><h3>{title}</h3><p className="muted">{text}</p></div>
          ))}
        </div>
      </section>

      <section className="block split">
        <div>
          <h2 className="h-section">Custom themes</h2>
          <p className="muted">Start from a ready-made look, then change the colors, fonts, button shapes and layout until it feels like you.</p>
          <div className="swatches">
            {Object.entries(PRESETS).map(([k, p]) => (
              <span key={k} className="swatch-chip"><span className="swatch" style={{ background: p.background_color }}><i style={{ background: p.button_color }} /></span>{p.label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="block split">
        <div>
          <h2 className="h-section">Portfolio showcase</h2>
          <p className="muted">Designers, developers, photographers and makers can put their best projects right under their links, with a picture, a short description and a link to the full story.</p>
        </div>
        <Phone themeName="light" data={PORTFOLIO} tall />
      </section>

      <section className="block" id="examples">
        <h2 className="h-section">Example LinkPages</h2>
        <div className="examples">
          {EXAMPLES.map((e) => <Phone key={e.profile.id} themeName={e.theme} data={e} />)}
        </div>
      </section>

      <section className="block" id="faq">
        <h2 className="h-section">Frequently asked questions</h2>
        <div className="faq">
          {FAQ.map(([q, a]) => (<details key={q}><summary>{q}</summary><p className="muted">{a}</p></details>))}
        </div>
      </section>

      <section className="block cta">
        <h2 className="h-section"><FiShield aria-hidden="true" /> Ready when you are</h2>
        <Link className="btn lg" to="/register">Create Your Free Page</Link>
      </section>

      <footer className="site-foot">
        <span className="brand">LinkPage</span>
        <span className="muted">© {new Date().getFullYear()} LinkPage</span>
        <span className="row"><Link to="/login">Log in</Link><Link to="/register">Sign up</Link></span>
      </footer>
    </div>
  );
}
