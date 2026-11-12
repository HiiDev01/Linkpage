
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCheck,
  FiCode,
  FiDroplet,
  FiGlobe,
  FiGrid,
  FiLink,
  FiLock,
  FiMenu,
  FiSmartphone,
  FiBriefcase,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { FaReact } from 'react-icons/fa';
import { BsQrCode } from 'react-icons/bs';
import { useState } from 'react';

import ThemeToggle from '../components/ThemeToggle.jsx';
import ProfileView from '../components/ProfileView.jsx';
import { PRESETS, fromPreset } from '../themes.js';


// --------------------------------------------------
// SAMPLE PROFILE DATA
// Marketing previews only. Real pages load from Supabase.
// --------------------------------------------------

const sample = (id, p) => ({
  profile: {
    id,
    username: p.username,
    full_name: p.name,
    professional_title: p.title,
    bio: p.bio,
    location: p.location || null,
    profile_image: null,
    contact_email: p.email || null,
    phone: null,
    website: null,
  },

  links: p.links.map((item, index) => ({
    id: `${id}-l${index}`,
    title: item[0],
    description: item[1] || null,
    icon: item[2] || null,
    url: 'https://example.com',
    is_active: true,
  })),

  socials: ['instagram', 'github', 'linkedin']
    .slice(0, p.socials ?? 3)
    .map((platform) => ({
      id: `${id}-${platform}`,
      platform,
      url: 'https://example.com',
      is_visible: true,
    })),

  projects: p.projects || [],
});


const EXAMPLES = [
  {
    theme: 'dark',
    ...sample('a', {
      username: 'mira',
      name: 'Mira Okafor',
      title: 'Music producer',
      bio: 'Beats, remixes and sample packs.',
      location: 'Lagos',
      links: [
        ['New EP: Night Shift', 'Out now', '🎧'],
        ['Sample pack', null, '📦'],
        ['Book a session', null, '📅'],
      ],
    }),
  },

  {
    theme: 'creative',
    ...sample('b', {
      username: 'sol',
      name: 'Sol Bakery',
      title: 'Sourdough & pastries',
      bio: 'Small-batch baking. Pickup Thursdays.',
      location: 'Leeds',
      links: [
        ['Order this week’s box'],
        ['Menu'],
        ['Find us'],
      ],
    }),
  },

  {
    theme: 'minimal',
    ...sample('c', {
      username: 'jonas',
      name: 'Jonas Reyes',
      title: 'Architect',
      bio: 'Housing, adaptive reuse and public spaces.',
      links: [
        ['Selected work'],
        ['Journal'],
        ['Contact'],
      ],
    }),
  },
];


const PORTFOLIO = sample('p', {
  username: 'dana',
  name: 'Dana Whitfield',
  title: 'Product designer',
  bio: 'Design systems and mobile applications.',
  socials: 2,

  links: [
    ['Resume'],
    ['Contact me'],
  ],

  projects: [
    {
      id: 'p1',
      title: 'Ledger: budgeting app',
      description: 'Redesigned onboarding and improved user experience.',
      technologies: ['Figma', 'React Native'],
      project_url: 'https://example.com',
      image_url: null,
    },
    {
      id: 'p2',
      title: 'Orbit design system',
      description: 'Components and tokens shared by product teams.',
      technologies: ['Storybook', 'CSS'],
      project_url: 'https://example.com',
      image_url: null,
    },
  ],
});


// --------------------------------------------------
// CONTENT
// --------------------------------------------------

const FEATURES = [
  {
    icon: FiLink,
    number: '01',
    title: 'All your links, together.',
    description:
      'Bring your websites, social platforms, contact details and important destinations into one organized page.',
  },
  {
    icon: FiGrid,
    number: '02',
    title: 'A portfolio that speaks.',
    description:
      'Showcase projects, descriptions, technologies and external work links without building a separate website.',
  },
  {
    icon: FiDroplet,
    number: '03',
    title: 'Your page, your identity.',
    description:
      'Choose a visual theme and customize the appearance of your page to reflect your personal brand.',
  },
  {
    icon: FiBarChart2,
    number: '04',
    title: 'Understand engagement.',
    description:
      'See profile views and link clicks through your page analytics.',
  },
  {
    icon: BsQrCode,
    number: '05',
    title: 'Share beyond the screen.',
    description:
      'Use your personal QR code on business cards, promotional materials and presentations.',
  },
  {
    icon: FiSmartphone,
    number: '06',
    title: 'Designed for every screen.',
    description:
      'Your published page adapts to mobile phones, tablets and desktop screens.',
  },
];

const AUDIENCES = [
  {
    icon: FiUsers,
    title: 'Creators',
    description:
      'Bring your content, social accounts, collaborations and important links together.',
  },
  {
    icon: FiCode,
    title: 'Developers',
    description:
      'Present your GitHub, projects, portfolio and professional profile.',
  },
  {
    icon: FiBriefcase,
    title: 'Freelancers',
    description:
      'Give potential clients one destination to explore your work and contact you.',
  },
  {
    icon: FiGlobe,
    title: 'Businesses',
    description:
      'Make your services, contact information and online destinations accessible.',
  },
];

const FAQ = [
  [
    'What is Tapaly?',
    'Tapaly is a personal page builder that allows you to bring your links, social profiles, projects and professional information together in one shareable page.',
  ],
  [
    'Is Tapaly free?',
    'Yes. You can create your page, add links and publish your profile for free.',
  ],
  [
    'Do I need coding experience?',
    'No. You can create and customize your page without writing code.',
  ],
  [
    'Can I showcase my portfolio?',
    'Yes. You can add projects with descriptions, technologies, images and external links.',
  ],
  [
    'Can I customize my page?',
    'Yes. Tapaly provides themes and customization options for your personal page.',
  ],
  [
    'Can I change my username?',
    'Yes, provided your preferred username is available.',
  ],
  [
    'Does Tapaly provide analytics?',
    'Yes. Tapaly provides page views and link click statistics.',
  ],
  [
    'Can I control my published page?',
    'Yes. You can publish or unpublish your page from your account.',
  ],
];


// --------------------------------------------------
// REUSABLE COMPONENTS
// --------------------------------------------------

function Logo() {
  return (
    <Link to="/" className="tapaly-logo" aria-label="Tapaly home">
      <span>Tapaly<span className="tapaly-logo-dot">.</span></span>
    </Link>
  );
}


function SectionHeading({ eyebrow, title, description, align = 'center' }) {
  return (
    <div className={`tapaly-section-heading align-${align}`}>
      <span className="tapaly-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}


function Phone({ themeName, data, tall = false }) {
  return (
    <div className={`phone mini ${tall ? 'tall' : ''}`}>
      <ProfileView
        preview
        profile={data.profile}
        theme={fromPreset(themeName)}
        links={data.links}
        socials={data.socials}
        projects={data.projects}
      />
    </div>
  );
}


function FeatureCard({ feature }) {
  const Icon = feature.icon;

  return (
    <article className="tapaly-feature-card">
      <div className="tapaly-feature-top">
        <span className="tapaly-feature-icon">
          <Icon />
        </span>
        <span className="tapaly-feature-number">
          {feature.number}
        </span>
      </div>

      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </article>
  );
}


// --------------------------------------------------
// LANDING PAGE
// --------------------------------------------------

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="tapaly-site">

      {/* NAVIGATION */}

      <header className="tapaly-header">
        <div className="tapaly-nav">

          <Logo />

          <nav className={`tapaly-nav-links ${menuOpen ? 'is-open' : ''}`}>
            <a href="#features" onClick={closeMenu}>Features</a>
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="#examples" onClick={closeMenu}>Examples</a>
            <a href="#faq" onClick={closeMenu}>FAQ</a>

            <div className="tapaly-mobile-actions">
              <Link to="/login" onClick={closeMenu}>Log in</Link>
              <Link
                to="/register"
                className="tapaly-button primary"
                onClick={closeMenu}
              >
                Get started <FiArrowRight />
              </Link>
            </div>
          </nav>

          <div className="tapaly-nav-actions">
            <ThemeToggle />

            <Link to="/login" className="tapaly-login">
              Log in
            </Link>

            <Link to="/register" className="tapaly-button primary nav-cta">
              Get started <FiArrowRight />
            </Link>
          </div>

          <button
            type="button"
            className="tapaly-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>

        </div>
      </header>


      {/* HERO */}

      <section className="tapaly-hero">

        <div className="tapaly-hero-inner">

          <div className="tapaly-hero-copy">

            <div className="tapaly-hero-label">
              <span />
              YOUR PERSONAL SPACE ON THE INTERNET
            </div>

            <h1>
              Everything you do.
              <br />
              <span>One place to find you.</span>
            </h1>

            <p className="tapaly-hero-description">
              Your links, projects, social profiles and professional
              identity deserve more than scattered URLs.
              Bring everything together with one personal page.
            </p>

            <div className="tapaly-hero-buttons">
              <Link to="/register" className="tapaly-button primary large">
                Create your free page
                <FiArrowRight />
              </Link>

              <a href="#examples" className="tapaly-button outline large">
                Explore pages
              </a>
            </div>

            <div className="tapaly-hero-note">
              <FiCheck />
              Free to get started. No coding required.
            </div>

          </div>


          <div className="tapaly-hero-product">

            <div className="tapaly-product-window">

              <div className="tapaly-window-header">
                <div className="tapaly-window-controls">
                  <i />
                  <i />
                  <i />
                </div>

                <div className="tapaly-window-address">
                  tapaly.com/mira
                </div>

                <span className="tapaly-window-status">
                  <span />
                  Live preview
                </span>
              </div>

              <div className="tapaly-product-body">
                <Phone
                  themeName="dark"
                  data={EXAMPLES[0]}
                  tall
                />
              </div>

              <div className="tapaly-window-footer">
                <span>Personal page</span>
                <span>Preview mode</span>
              </div>

            </div>

            <div className="tapaly-product-caption">
              <span>01 / PERSONAL PAGE</span>
              <span>One link. Your entire presence.</span>
            </div>

          </div>

        </div>

        <div className="tapaly-hero-bottom">
          <span>BUILT FOR YOUR ONLINE PRESENCE</span>
          <div>
            <span><FiLink /> Links</span>
            <span><FiGrid /> Portfolio</span>
            <span><BsQrCode /> QR sharing</span>
            <span><FiBarChart2 /> Analytics</span>
          </div>
        </div>

      </section>


      {/* INTRODUCTION */}

      <section className="tapaly-intro tapaly-section">

        <div className="tapaly-intro-label">
          <span className="tapaly-eyebrow">THE PROBLEM</span>
          <span className="tapaly-section-index">01 — INTRODUCTION</span>
        </div>

        <div className="tapaly-intro-content">
          <h2>
            Stop sending people
            <span> in different directions.</span>
          </h2>

          <p>
            Your audience shouldn't have to search through different
            platforms to find your work, contact information or
            social profiles.
          </p>

          <p>
            Tapaly gives you one central destination to organize
            everything you want people to discover.
          </p>

          <Link to="/register" className="tapaly-text-link">
            Build your personal page <FiArrowUpRight />
          </Link>
        </div>

      </section>


      {/* FEATURES */}

      <section className="tapaly-features-section tapaly-section" id="features">

        <SectionHeading
          eyebrow="WHAT YOU CAN DO"
          title="Everything important, in one place."
          description="The tools to create a personal page that represents your work, identity and online presence."
        />

        <div className="tapaly-features-grid">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.number}
              feature={feature}
            />
          ))}
        </div>

      </section>


      {/* PORTFOLIO SHOWCASE */}

      <section className="tapaly-portfolio-section tapaly-section">

        <div className="tapaly-portfolio-copy">

          <span className="tapaly-eyebrow">YOUR WORK MATTERS</span>

          <h2>
            Not just links.
            <br />
            <span>A place for your work.</span>
          </h2>

          <p>
            A personal page should tell people more than where
            to find you. Show them what you can do.
          </p>

          <div className="tapaly-portfolio-points">
            <div>
              <FiCheck />
              <span>Showcase your projects</span>
            </div>

            <div>
              <FiCheck />
              <span>Add descriptions and technologies</span>
            </div>

            <div>
              <FiCheck />
              <span>Connect to your external work</span>
            </div>

            <div>
              <FiCheck />
              <span>Present your professional identity</span>
            </div>
          </div>

          <Link to="/register" className="tapaly-text-link">
            Create your portfolio <FiArrowUpRight />
          </Link>

        </div>

        <div className="tapaly-portfolio-preview">

          <div className="tapaly-preview-heading">
            <div>
              <span className="tapaly-eyebrow">PROFILE PREVIEW</span>
              <h3>Personal portfolio</h3>
            </div>
            <span className="tapaly-preview-number">02</span>
          </div>

          <Phone
            themeName="light"
            data={PORTFOLIO}
            tall
          />

          <div className="tapaly-preview-footer">
            <span>PROJECTS</span>
            <span>LINKS</span>
            <span>PROFILE</span>
          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}

      <section className="tapaly-how-section tapaly-section" id="how-it-works">

        <SectionHeading
          eyebrow="SIMPLE BY DESIGN"
          title="From an idea to a shareable page."
          description="Creating your online presence shouldn't be complicated."
        />

        <div className="tapaly-steps">

          <article className="tapaly-step">
            <span className="tapaly-step-number">01</span>
            <div className="tapaly-step-icon"><FiUsers /></div>
            <h3>Claim your username</h3>
            <p>
              Create an account and choose the username
              you want people to use to find you.
            </p>
          </article>

          <article className="tapaly-step">
            <span className="tapaly-step-number">02</span>
            <div className="tapaly-step-icon"><FiGrid /></div>
            <h3>Make it yours</h3>
            <p>
              Add your links, projects, social profiles
              and select a theme that represents you.
            </p>
          </article>

          <article className="tapaly-step">
            <span className="tapaly-step-number">03</span>
            <div className="tapaly-step-icon"><FiGlobe /></div>
            <h3>Publish and share</h3>
            <p>
              Make your page public and share your
              personal URL anywhere.
            </p>
          </article>

        </div>

      </section>


      {/* CUSTOM THEMES */}

      <section className="tapaly-themes-section tapaly-section">

        <div className="tapaly-themes-copy">

          <span className="tapaly-eyebrow">DESIGNED AROUND YOU</span>

          <h2>
            Your page should
            <span> feel like yours.</span>
          </h2>

          <p>
            Different people have different styles.
            Choose from available designs and customize
            your page to match your identity.
          </p>

          <div className="tapaly-theme-list">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <div className="tapaly-theme-item" key={key}>
                <span
                  className="tapaly-theme-swatch"
                  style={{ background: preset.background_color }}
                >
                  <i style={{ background: preset.button_color }} />
                </span>
                <span>{preset.label}</span>
              </div>
            ))}
          </div>

          <Link to="/register" className="tapaly-text-link">
            Create your own page <FiArrowUpRight />
          </Link>

        </div>

        <div className="tapaly-theme-display">

          <div className="tapaly-theme-display-top">
            <span>AVAILABLE STYLES</span>
            <span>03 / CUSTOMIZATION</span>
          </div>

          <div className="tapaly-theme-samples">

            <div className="tapaly-theme-sample sample-light">
              <span>01</span>
              <strong>Minimal</strong>
              <small>Clean and simple</small>
            </div>

            <div className="tapaly-theme-sample sample-dark">
              <span>02</span>
              <strong>Dark</strong>
              <small>Bold and modern</small>
            </div>

            <div className="tapaly-theme-sample sample-creative">
              <span>03</span>
              <strong>Creative</strong>
              <small>Expressive and unique</small>
            </div>

          </div>

        </div>

      </section>


      {/* AUDIENCES */}

      <section className="tapaly-audience-section tapaly-section">

        <SectionHeading
          eyebrow="WHO IS TAPALY FOR?"
          title="One page. Different purposes."
          description="Whether you're growing an audience or building your career, give people one place to discover what you do."
        />

        <div className="tapaly-audience-grid">
          {AUDIENCES.map((audience) => {
            const Icon = audience.icon;

            return (
              <article className="tapaly-audience-card" key={audience.title}>
                <Icon />
                <h3>{audience.title}</h3>
                <p>{audience.description}</p>
                <span>Explore possibilities <FiArrowUpRight /></span>
              </article>
            );
          })}
        </div>

      </section>


      {/* EXAMPLES */}

      <section className="tapaly-examples-section tapaly-section" id="examples">

        <SectionHeading
          eyebrow="EXPLORE THE POSSIBILITIES"
          title="Different identities. One simple platform."
          description="See how different people can use Tapaly to bring their online presence together."
        />

        <div className="tapaly-examples-grid">

          {EXAMPLES.map((example, index) => (
            <article className="tapaly-example-card" key={example.profile.id}>

              <div className="tapaly-example-top">
                <span>0{index + 1}</span>
                <span>{example.profile.professional_title}</span>
              </div>

              <Phone
                themeName={example.theme}
                data={example}
              />

              <div className="tapaly-example-bottom">
                <strong>{example.profile.full_name}</strong>
                <span>@{example.profile.username}</span>
              </div>

            </article>
          ))}

        </div>

      </section>


      {/* QR SHARING */}

      <section className="tapaly-qr-section tapaly-section">

        <div className="tapaly-qr-content">

          <span className="tapaly-eyebrow">SHARE YOUR PRESENCE</span>

          <h2>
            One page.
            <br />
            <span>More ways to connect.</span>
          </h2>

          <p>
            Take your personal page beyond social media.
            Share your QR code on business cards, printed
            materials and anywhere you want people to find you.
          </p>

          <Link to="/register" className="tapaly-text-link">
            Get started with Tapaly <FiArrowUpRight />
          </Link>

        </div>

        <div className="tapaly-qr-card">
          <BsQrCode />
          <strong>Your page. One scan away.</strong>
          <span>QR CODE PREVIEW</span>
        </div>

      </section>


      {/* FAQ */}

      <section className="tapaly-faq-section tapaly-section" id="faq">

        <div className="tapaly-faq-intro">
          <span className="tapaly-eyebrow">NEED TO KNOW MORE?</span>
          <h2>Questions, answered.</h2>
          <p>
            Find out more about creating and managing
            your personal page with Tapaly.
          </p>
        </div>

        <div className="tapaly-faq-list">
          {FAQ.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <span>+</span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>

      </section>


      {/* FINAL CTA */}

      <section className="tapaly-final-section">

        <div className="tapaly-final-inner">

          <span className="tapaly-eyebrow">
            YOUR ONLINE PRESENCE STARTS HERE
          </span>

          <h2>
            Make it easier for people
            <br />
            <span>to discover you.</span>
          </h2>

          <p>
            Your links, your work and your identity.
            All together, in one personal page.
          </p>

          <Link to="/register" className="tapaly-button final-button">
            Create your free page <FiArrowRight />
          </Link>

        </div>

      </section>


      {/* FOOTER */}

      <footer className="tapaly-footer">

        <div className="tapaly-footer-main">

          <div className="tapaly-footer-brand">
            <Logo />
            <p>
              One personal page for everything
              you want people to discover.
            </p>
          </div>

          <div className="tapaly-footer-column">
            <strong>Product</strong>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#examples">Examples</a>
          </div>

          <div className="tapaly-footer-column">
            <strong>Resources</strong>
            <a href="#faq">Frequently asked questions</a>
            <Link to="/register">Get started</Link>
          </div>

          <div className="tapaly-footer-column">
            <strong>Account</strong>
            <Link to="/login">Log in</Link>
            <Link to="/register">Create account</Link>
          </div>

        </div>

        <div className="tapaly-footer-bottom">
          <span>© {new Date().getFullYear()} Tapaly. All rights reserved.</span>
          <span>Made for your digital identity.</span>
        </div>

      </footer>

    </main>
  );
}
