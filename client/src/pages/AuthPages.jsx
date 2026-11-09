import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../auth.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="auth-top"><Link to="/" className="brand">LinkPage</Link><ThemeToggle /></div>
      <div className="auth-card">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
        {footer && <p className="auth-foot muted">{footer}</p>}
      </div>
    </div>
  );
}

function Field({ label, error, hint, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} aria-invalid={!!error} />
      {error ? <small className="err">{error}</small> : hint ? <small className="muted">{hint}</small> : null}
    </label>
  );
}

const Alert = ({ kind = 'error', children }) => children ? <div className={`alert ${kind}`} role="alert">{children}</div> : null;
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!emailOk(form.email)) return setError('Enter a valid email address.');
    setBusy(true); setError('');
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) { setError(errorMessage(err)); setBusy(false); }
  };

  return (
    <Shell title="Welcome back" subtitle="Log in to manage your page."
      footer={<>New here? <Link to="/register">Create a free page</Link></>}>
      <form onSubmit={submit} noValidate>
        <Alert>{error}</Alert>
        <Field label="Email" type="email" autoComplete="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Field label="Password" type="password" autoComplete="current-password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Link className="small" to="/forgot-password">Forgot your password?</Link>
        <button className="btn block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [uname, setUname] = useState({ state: 'idle', msg: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Live username availability (debounced)
  useEffect(() => {
    const u = form.username.trim().toLowerCase();
    if (!u) return setUname({ state: 'idle', msg: '' });
    setUname({ state: 'checking', msg: 'Checking…' });
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/username-available/${encodeURIComponent(u)}`);
        setUname(data.available ? { state: 'ok', msg: 'Available' } : { state: 'bad', msg: data.reason });
      } catch { setUname({ state: 'idle', msg: '' }); }
    }, 400);
    return () => clearTimeout(t);
  }, [form.username]);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Enter your name.';
    if (!emailOk(form.email)) errs.email = 'Enter a valid email address.';
    if (form.password.length < 8) errs.password = 'Use at least 8 characters.';
    if (uname.state === 'bad') errs.username = uname.msg;
    if (!form.username.trim()) errs.username = 'Choose a username.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true); setError('');
    try {
      const data = await register({ ...form, username: form.username.trim().toLowerCase() });
      if (data.needsConfirmation) { setSent(true); setBusy(false); }
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      const f = err.response?.data?.field;
      if (f) setErrors({ [f]: errorMessage(err) }); else setError(errorMessage(err));
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Shell title="Check your inbox">
        <Alert kind="success">We sent a confirmation link to {form.email}. Open it, then log in.</Alert>
        <Link className="btn block" to="/login">Go to log in</Link>
      </Shell>
    );
  }

  return (
    <Shell title="Create your page" subtitle="Free to start. Takes about a minute."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}>
      <form onSubmit={submit} noValidate>
        <Alert>{error}</Alert>
        <Field label="Full name" autoComplete="name" value={form.full_name} onChange={set('full_name')} error={errors.full_name} />
        <Field label="Username" autoComplete="username" value={form.username} onChange={set('username')}
          error={errors.username || (uname.state === 'bad' ? uname.msg : '')}
          hint={uname.state === 'ok' ? `✓ linkpage.com/${form.username.toLowerCase()} is available` : `linkpage.com/${form.username.toLowerCase() || 'username'}`} />
        <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Field label="Password" type="password" autoComplete="new-password" value={form.password}
          onChange={set('password')} error={errors.password} hint="At least 8 characters" />
        <button className="btn block" disabled={busy}>{busy ? 'Creating…' : 'Create your free page'}</button>
      </form>
    </Shell>
  );
}

export function Forgot() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!emailOk(email)) return setError('Enter a valid email address.');
    setBusy(true); setError('');
    try { const { data } = await api.post('/auth/forgot-password', { email }); setMsg(data.message); }
    catch (err) { setError(errorMessage(err)); }
    setBusy(false);
  };

  return (
    <Shell title="Reset your password" subtitle="Enter your email and we’ll send a reset link."
      footer={<Link to="/login">Back to log in</Link>}>
      <form onSubmit={submit} noValidate>
        <Alert>{error}</Alert>
        <Alert kind="success">{msg}</Alert>
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn block" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      </form>
    </Shell>
  );
}

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Supabase puts the recovery token in the URL hash: #access_token=...&type=recovery
  const token = new URLSearchParams(window.location.hash.slice(1)).get('access_token');

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters.');
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/auth/reset-password', { access_token: token, password });
      setMsg(data.message);
      history.replaceState(null, '', window.location.pathname);
    } catch (err) { setError(errorMessage(err)); }
    setBusy(false);
  };

  if (!token && !msg) {
    return (
      <Shell title="Link not valid">
        <Alert>This reset link is missing or has expired. Request a new one.</Alert>
        <Link className="btn block" to="/forgot-password">Request a new link</Link>
      </Shell>
    );
  }

  return (
    <Shell title="Choose a new password">
      {msg ? (
        <>
          <Alert kind="success">{msg}</Alert>
          <Link className="btn block" to="/login">Log in</Link>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          <Alert>{error}</Alert>
          <Field label="New password" type="password" autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters" />
          <button className="btn block" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
        </form>
      )}
    </Shell>
  );
}
