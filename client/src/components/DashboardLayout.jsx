import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiHome, FiUser, FiLink, FiGrid, FiDroplet, FiBarChart2, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../auth.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: FiHome, end: true },
  { to: '/dashboard/profile', label: 'Profile', icon: FiUser },
  { to: '/dashboard/links', label: 'Links', icon: FiLink },
  { to: '/dashboard/portfolio', label: 'Portfolio', icon: FiGrid },
  { to: '/dashboard/appearance', label: 'Appearance', icon: FiDroplet },
  { to: '/dashboard/analytics', label: 'Analytics', icon: FiBarChart2 },
];

export default function DashboardLayout() {
  const { profile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const navigate = useNavigate();

  const signOut = async () => { await logout(); navigate('/login', { replace: true }); };

  return (
    <div className="shell">
      <header className="topbar">
        <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu"><FiMenu /></button>
        <span className="brand">Tapaly</span>
        <ThemeToggle />
      </header>

      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-head">
          <span className="brand">Tapaly</span>
          <button className="icon-btn only-mobile" onClick={() => setOpen(false)} aria-label="Close menu"><FiX /></button>
        </div>
        <nav>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="who">
            <strong>{profile?.full_name || 'Your account'}</strong>
            <span>@{profile?.username}</span>
          </div>
          <div className="row">
            <ThemeToggle />
            <button className="btn ghost grow" onClick={() => setConfirming(true)}><FiLogOut /> Log out</button>
          </div>
        </div>
      </aside>

      <main className="content"><Outlet /></main>

      {confirming && (
        <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className="modal">
            <h2 id="logout-title">Log out of LinkPage?</h2>
            <p>You’ll need to sign in again to edit your page.</p>
            <div className="row end">
              <button className="btn ghost" onClick={() => setConfirming(false)}>Stay signed in</button>
              <button className="btn" onClick={signOut}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
