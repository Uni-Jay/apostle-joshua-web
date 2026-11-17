import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Rays from '../../components/Rays';
import { Icon } from '../../components/Icons';
import { Loading, useTitle } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { api, errMsg } from '../../lib/api';

/* ---------- Toasts ---------- */
let pushToast: (m: string) => void = () => undefined;
export const toast = (m: string) => pushToast(m);
function Toaster() {
  const [m, setM] = useState('');
  useEffect(() => { let t: any; pushToast = (x) => { setM(x); clearTimeout(t); t = setTimeout(() => setM(''), 2800); }; return () => clearTimeout(t); }, []);
  return <div className={`toast${m ? ' show' : ''}`} role="status" aria-live="polite">{m}</div>;
}

/* ---------- Guard ---------- */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div className="adm-login"><Loading label="Checking your session" /></div>;
  if (!user) return <Navigate to={`/admin/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return <>{children}</>;
}

const LINKS: [string, string, string][] = [
  ['/admin', 'grid', 'Overview'], ['/admin/sermons', 'video', 'Sermons & videos'], ['/admin/events', 'cal', 'Events'],
  ['/admin/blog', 'book', 'Devotionals'], ['/admin/gallery', 'img', 'Gallery photos'], ['/admin/prayer', 'heart', 'Prayer requests'],
  ['/admin/messages', 'mail', 'Messages'], ['/admin/chat', 'chat', 'Chat assistant'], ['/admin/settings', 'gear', 'Settings'],
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [badges, setBadges] = useState<{ prayer?: number; messages?: number; chat?: number }>({});
  const loc = useLocation();
  useEffect(() => { api.get('/dashboard').then((r) => setBadges({ prayer: r.data.counts.prayersNew, messages: r.data.counts.messagesNew, chat: r.data.counts.chatsUnseen })).catch(() => undefined); }, [loc.pathname]);
  return (
    <>
      <section className="dash">
        <aside className="side" aria-label="Dashboard">
          <div className="side-head"><img src="/images/logo.webp" alt="" width={36} height={36} /><div><b>APOSTLE JOSHUA</b><span>DASHBOARD</span></div></div>
          {LINKS.map(([to, ic, label]) => {
            const n = to === '/admin/prayer' ? badges.prayer : to === '/admin/messages' ? badges.messages : to === '/admin/chat' ? badges.chat : 0;
            return <NavLink key={to} to={to} end={to === '/admin'} className="snav" style={({ isActive }) => (isActive ? { background: 'var(--gold)', color: 'var(--ink)' } : undefined)}>
              <Icon name={ic} />{label}{n ? <span className="pill new" style={{ marginLeft: 'auto' }}>{n}</span> : null}</NavLink>;
          })}
          <div className="side-foot">
            <div className="who" style={{ background: 'none', border: 0, padding: '6px 8px' }}><div className="avatar">{(user?.name || 'A').charAt(0)}</div><div><b>{user?.name}</b><small>{user?.role === 'owner' ? 'Owner' : 'Admin'}</small></div></div>
            <Link className="snav" to="/"><Icon name="globe" />View website</Link>
            <button className="snav" onClick={() => { logout(); nav('/admin/login'); }}><Icon name="out" />Log out</button>
          </div>
        </aside>
        <div className="main"><Outlet /></div>
      </section>
      <Toaster />
    </>
  );
}

export function Topbar({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  useTitle(`${title} · Admin`);
  return <div className="topbar"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{children && <div className="btns">{children}</div>}</div>;
}

/* ---------- Auth screens ---------- */
function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  useTitle(title);
  return (
    <section className="adm-login" style={{ minHeight: '100vh' }}>
      <Rays cx={0.5} cy={-0.1} />
      <div className="login-card">
        <img src="/images/logo.webp" alt="" width={84} height={84} />
        <span className="eyebrow" style={{ justifyContent: 'center' }}>Apostle Joshua Outreach</span>
        <h1>{title}</h1>
        {children}
        <Link to="/" style={{ fontSize: 14 }}>&larr; Back to website</Link>
      </div>
    </section>
  );
}

function PwInput({ id, value, onChange, auto }: { id: string; value: string; onChange: (v: string) => void; auto: string }) {
  const [show, setShow] = useState(false);
  return <div className="pw"><input id={id} type={show ? 'text' : 'password'} autoComplete={auto} value={value} onChange={(e) => onChange(e.target.value)} required />
    <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'HIDE' : 'SHOW'}</button></div>;
}

export function Login() {
  const { user, login } = useAuth();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(sp.get('expired') ? 'Your session expired. Please sign in again.' : '');
  if (user) return <Navigate to={sp.get('next') || '/admin'} replace />;
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { await login(email.trim(), pw); nav(sp.get('next') || '/admin', { replace: true }); }
    catch (x) { setErr(errMsg(x, 'Could not sign in. Please try again.')); setBusy(false); }
  }
  return (
    <AuthCard title="Admin login">
      <p>Sign in to manage sermons, events, devotionals and messages.</p>
      <form onSubmit={submit} noValidate>
        <div className="field"><label htmlFor="l-email">Email</label><input id="l-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="field"><label htmlFor="l-pw">Password</label><PwInput id="l-pw" value={pw} onChange={setPw} auto="current-password" /></div>
        {err && <div className="notice err" role="alert">{err}</div>}
        <button className="btn btn-gold" type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <Link to="/admin/forgot-password" style={{ textAlign: 'center', fontSize: 14 }}>Forgot your password?</Link>
      </form>
    </AuthCard>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState(''); const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { const r = await api.post('/auth/forgot-password', { email: email.trim() }); setMsg(r.data.message); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  }
  return (
    <AuthCard title="Reset password">
      <p>Enter your admin email and we&rsquo;ll send you a link to choose a new password.</p>
      <form onSubmit={submit} noValidate>
        <div className="field"><label htmlFor="f-email">Email</label><input id="f-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        {msg && <div className="notice ok" role="status">{msg}</div>}
        {err && <div className="notice err" role="alert">{err}</div>}
        <button className="btn btn-gold" type="submit" disabled={busy || !!msg} style={{ width: '100%' }}>{busy ? 'Sending…' : 'Send reset link'}</button>
        <Link to="/admin/login" style={{ textAlign: 'center', fontSize: 14 }}>Back to sign in</Link>
      </form>
    </AuthCard>
  );
}

export function ResetPassword() {
  const [sp] = useSearchParams();
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('');
    if (pw.length < 8) return setErr('Use at least 8 characters.');
    if (pw !== pw2) return setErr('The two passwords don’t match.');
    setBusy(true);
    try { const r = await api.post('/auth/reset-password', { token: sp.get('token'), password: pw }); setMsg(r.data.message); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  }
  return (
    <AuthCard title="Choose a new password">
      {msg ? <><div className="notice ok" role="status">{msg}</div><Link className="btn btn-gold" to="/admin/login" style={{ width: '100%' }}>Sign in</Link></> : (
        <form onSubmit={submit} noValidate>
          <div className="field"><label htmlFor="r-pw">New password</label><PwInput id="r-pw" value={pw} onChange={setPw} auto="new-password" /></div>
          <div className="field"><label htmlFor="r-pw2">Confirm new password</label><PwInput id="r-pw2" value={pw2} onChange={setPw2} auto="new-password" /></div>
          {err && <div className="notice err" role="alert">{err}</div>}
          <button className="btn btn-gold" type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Saving…' : 'Save new password'}</button>
        </form>
      )}
    </AuthCard>
  );
}

export function DelBtn({ onConfirm, label = 'Delete' }: { onConfirm: () => void; label?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 3500); return () => clearTimeout(t); }, [armed]);
  return <button type="button" className="mini danger" onClick={() => (armed ? onConfirm() : setArmed(true))}>{armed ? 'Sure?' : label}</button>;
}
