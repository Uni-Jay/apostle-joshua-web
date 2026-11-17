import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg, telLink, waLink } from '../lib/api';
import { Icon } from './Icons';

type Action = { type: 'prayer_form' } | { type: 'contact_form'; subject: string } | { type: 'whatsapp' } | { type: 'call' };
interface Msg { role: 'user' | 'bot'; text: string; chips?: string[]; action?: Action | null; done?: boolean }
interface Config { enabled: boolean; name: string; greeting: string; chips: string[]; whatsapp: string; phone: string }

const STORE = 'ajo_chat_v1';
const load = (): { sessionId?: string; msgs?: Msg[]; nudged?: boolean } => { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } };
const save = (v: object) => { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch { /* storage unavailable: chat still works for this visit */ } };

/* Tiny, safe formatter: **bold**, [label](link), line breaks. No HTML is ever injected. */
function Rich({ text }: { text: string }) {
  const lines = text.split('\n');
  return <>{lines.map((ln, i) => {
    const out: ReactNode[] = [];
    const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
    let last = 0, m: RegExpExecArray | null, k = 0;
    while ((m = re.exec(ln))) {
      if (m.index > last) out.push(ln.slice(last, m.index));
      if (m[1]) out.push(<b key={k++}>{m[1]}</b>);
      else if (m[3].startsWith('/')) out.push(<Link key={k++} to={m[3]}>{m[2]}</Link>);
      else if (/^https?:\/\//.test(m[3])) out.push(<a key={k++} href={m[3]} target="_blank" rel="noreferrer">{m[2]}</a>);
      else out.push(m[2]);
      last = m.index + m[0].length;
    }
    if (last < ln.length) out.push(ln.slice(last));
    return <span key={i}>{out}{i < lines.length - 1 && <br />}</span>;
  })}</>;
}

export default function ChatWidget() {
  const saved = useRef(load());
  const [cfg, setCfg] = useState<Config | null>(null);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(saved.current.msgs || []);
  const [sessionId, setSessionId] = useState<string | undefined>(saved.current.sessionId);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [nudge, setNudge] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { api.get('/chat/config').then((r) => setCfg(r.data)).catch(() => setCfg(null)); }, []);
  useEffect(() => { save({ sessionId, msgs: msgs.slice(-60), nudged: saved.current.nudged }); }, [sessionId, msgs]);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs, typing, open]);
  useEffect(() => {
    if (!cfg?.enabled || saved.current.nudged) return;
    const t = setTimeout(() => setNudge(true), 9000);
    return () => clearTimeout(t);
  }, [cfg]);
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    document.body.classList.add('chat-open');
    return () => { window.removeEventListener('keydown', esc); document.body.classList.remove('chat-open'); };
  }, [open]);

  if (!cfg?.enabled) return null;

  function openChat() {
    setOpen(true); setNudge(false); saved.current.nudged = true;
    if (!msgs.length) setMsgs([{ role: 'bot', text: cfg!.greeting, chips: cfg!.chips }]);
  }

  async function send(raw: string) {
    const message = raw.trim();
    if (!message || typing) return;
    setText('');
    setMsgs((m) => [...m, { role: 'user', text: message }]);
    setTyping(true);
    try {
      const r = await api.post('/chat', { sessionId, message, page: window.location.pathname });
      setSessionId(r.data.sessionId);
      setMsgs((m) => [...m, { role: 'bot', text: r.data.reply.text, chips: r.data.reply.chips, action: r.data.reply.action }]);
    } catch (x) {
      setMsgs((m) => [...m, { role: 'bot', text: `${errMsg(x, 'Sorry, I could not reply just now.')} You can also reach the team on WhatsApp.`, action: { type: 'whatsapp' } }]);
    } finally { setTyping(false); }
  }

  const lastUser = [...msgs].reverse().find((m) => m.role === 'user')?.text || '';
  const waHref = cfg.whatsapp ? `${waLink(cfg.whatsapp)}?text=${encodeURIComponent(`Hello, I was chatting on the Apostle Joshua Outreach website.${lastUser ? ` ${lastUser}` : ''}`)}` : '/contact';
  const markDone = (i: number, note: string) => setMsgs((m) => [...m.map((x, j) => (j === i ? { ...x, done: true } : x)), { role: 'bot', text: note, chips: ['Upcoming events', 'Watch a message'] }]);
  const lastIdx = msgs.length - 1;

  return (
    <>
      {!open && nudge && (
        <div className="chat-nudge" role="status">
          <button className="chat-nudge-x" aria-label="Dismiss" onClick={() => { setNudge(false); saved.current.nudged = true; save({ sessionId, msgs, nudged: true }); }}>×</button>
          <button className="chat-nudge-body" onClick={openChat}><b>Need prayer or information?</b><span>Ask me anything. I reply instantly.</span></button>
        </div>
      )}
      {!open && (
        <button className="chat-fab" onClick={openChat} aria-label={`Chat with ${cfg.name}`}>
          <Icon name="chat" size={26} /><span className="chat-fab-label">Ask us</span>
        </button>
      )}
      {open && (
        <section className="chat-panel" role="dialog" aria-label={`Chat with ${cfg.name}`}>
          <header className="chat-head">
            <img src="/images/logo.webp" alt="" width={40} height={40} />
            <div><b>{cfg.name}</b><span><i className="chat-dot" />Online · replies instantly</span></div>
            <a className="chat-head-btn" href={waHref} target="_blank" rel="noreferrer" aria-label="Continue on WhatsApp" title="Continue on WhatsApp"><Icon name="phone" size={18} /></a>
            <button className="chat-head-btn" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
          </header>
          <div className="chat-log" ref={logRef} aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div className="chat-bubble"><Rich text={m.text} /></div>
                {m.action && !m.done && m.action.type === 'prayer_form' && <PrayerMini sessionId={sessionId} prefill={i === lastIdx ? lastUser : ''} onDone={(n) => markDone(i, `Thank you, ${n}. 🙏 Your prayer request has been received. Apostle Joshua and the prayer team are standing with you.`)} />}
                {m.action && !m.done && m.action.type === 'contact_form' && <ContactMini subject={m.action.subject} sessionId={sessionId} prefill={i === lastIdx ? lastUser : ''} onDone={(n) => markDone(i, `Thank you, ${n}! Your message has been sent and the team will get back to you soon.`)} />}
                {m.action?.type === 'whatsapp' && <a className="chat-cta wa" href={waHref} target="_blank" rel="noreferrer"><Icon name="chat" size={18} />Continue on WhatsApp</a>}
                {m.action?.type === 'call' && <div className="chat-ctas"><a className="chat-cta danger" href="tel:112">Call 112 (emergency)</a>{cfg.phone && <a className="chat-cta" href={telLink(cfg.phone)}><Icon name="phone" size={16} />Call {cfg.phone}</a>}</div>}
                {i === lastIdx && m.role === 'bot' && !!m.chips?.length && !typing && (
                  <div className="chat-chips">{m.chips.map((c) => <button key={c} onClick={() => send(c)}>{c}</button>)}</div>
                )}
              </div>
            ))}
            {typing && <div className="chat-msg bot"><div className="chat-bubble chat-typing" aria-label="Typing"><i /><i /><i /></div></div>}
          </div>
          <form className="chat-input" onSubmit={(e: FormEvent) => { e.preventDefault(); send(text); }}>
            <label htmlFor="chat-text" className="sr">Type your message</label>
            <textarea id="chat-text" ref={inputRef} rows={1} value={text} maxLength={1000} placeholder="Type your message…"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text); } }} />
            <button type="submit" disabled={!text.trim() || typing} aria-label="Send">➤</button>
          </form>
          <p className="chat-foot">Automated assistant. Chats are saved so our team can follow up.</p>
        </section>
      )}
    </>
  );
}

function MiniForm({ title, children, busy, err, onSubmit, submit }: { title: string; children: ReactNode; busy: boolean; err: string; onSubmit: () => void; submit: string }) {
  return (
    <form className="chat-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }} noValidate>
      <b>{title}</b>{children}
      {err && <div className="notice err" role="alert">{err}</div>}
      <button className="btn btn-gold" type="submit" disabled={busy}>{busy ? 'Sending…' : submit}</button>
    </form>
  );
}

function PrayerMini({ sessionId, prefill, onDone }: { sessionId?: string; prefill: string; onDone: (name: string) => void }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', request: /pray/i.test(prefill) && prefill.length > 18 ? prefill : '', website: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function submit() {
    setErr(''); setBusy(true);
    try { await api.post('/prayer-requests', { ...f, chat_session: sessionId }); onDone(f.name.split(' ')[0]); }
    catch (x) { setErr(errMsg(x)); setBusy(false); }
  }
  return (
    <MiniForm title="Prayer request" busy={busy} err={err} onSubmit={submit} submit="Send prayer request">
      <input aria-label="Your name" placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input aria-label="Phone or WhatsApp (optional)" placeholder="Phone / WhatsApp (optional)" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <input aria-label="Email (optional)" placeholder="Email (optional)" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <textarea aria-label="Your prayer request" placeholder="How can we pray for you?" rows={3} value={f.request} onChange={(e) => setF({ ...f, request: e.target.value })} />
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
    </MiniForm>
  );
}

function ContactMini({ subject, sessionId, prefill, onDone }: { subject: string; sessionId?: string; prefill: string; onDone: (name: string) => void }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', body: prefill.length > 18 ? prefill : '', website: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function submit() {
    setErr(''); setBusy(true);
    try { await api.post('/messages', { ...f, subject, chat_session: sessionId }); onDone(f.name.split(' ')[0]); }
    catch (x) { setErr(errMsg(x)); setBusy(false); }
  }
  return (
    <MiniForm title={subject} busy={busy} err={err} onSubmit={submit} submit="Send">
      <input aria-label="Your name" placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input aria-label="Phone or WhatsApp" placeholder="Phone / WhatsApp" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <input aria-label="Email (optional)" placeholder="Email (optional)" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <textarea aria-label="Your message" placeholder={subject === 'Invite Apostle Joshua' ? 'Programme name, date, place…' : 'Your message'} rows={3} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
    </MiniForm>
  );
}
