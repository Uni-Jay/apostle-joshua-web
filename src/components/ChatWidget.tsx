import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg, telLink, waLink } from '../lib/api';
import { Icon } from './Icons';

type Action = { type: 'prayer_form' } | { type: 'contact_form'; subject: string } | { type: 'whatsapp' } | { type: 'handoff' } | { type: 'call' };
interface Msg { id?: number; role: 'user' | 'bot' | 'agent' | 'system'; text: string; author?: string | null; chips?: string[]; action?: Action | null; done?: boolean }
interface Config { enabled: boolean; name: string; greeting: string; chips: string[]; whatsapp: string; phone: string; agentsOnline: number }
type Mode = 'bot' | 'live';

const STORE = 'ajo_chat_v1';
// Shown straight away, so the chat button never waits for the server (which can take a minute to wake up).
const FALLBACK: Config = {
  enabled: true, name: 'Outreach Assistant', agentsOnline: 0,
  greeting: 'Hello, and welcome! 🙌 I can tell you about upcoming events, share a message to watch, take your prayer request, or connect you with our team. How can I help?',
  chips: ['Upcoming events', 'Send a prayer request', 'Watch a message', 'Invite Apostle Joshua', 'Talk to someone'],
  whatsapp: '+234 907 605 2317', phone: '+234 811 823 5172',
};
const load = (): { sessionId?: string; msgs?: Msg[]; nudged?: boolean; mode?: Mode; lastId?: number; agentName?: string } => { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } };
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
  const [cfg, setCfg] = useState<Config>(FALLBACK);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(saved.current.msgs || []);
  const [sessionId, setSessionId] = useState<string | undefined>(saved.current.sessionId);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [mode, setMode] = useState<Mode>(saved.current.mode || 'bot');
  const [lastId, setLastId] = useState<number>(saved.current.lastId || 0);
  const [agentName, setAgentName] = useState<string | undefined>(saved.current.agentName);
  const [unread, setUnread] = useState(0);
  const openRef = useRef(false);
  openRef.current = open;
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { api.get('/chat/config', { timeout: 70000 }).then((r) => setCfg({ ...FALLBACK, ...r.data })).catch(() => undefined); }, []);
  useEffect(() => { save({ sessionId, msgs: msgs.slice(-60), nudged: saved.current.nudged, mode, lastId, agentName }); }, [sessionId, msgs, mode, lastId, agentName]);
  // Keep the "team online" status fresh.
  useEffect(() => {
    const t = setInterval(() => api.get('/chat/config').then((r) => setCfg({ ...FALLBACK, ...r.data })).catch(() => undefined), 60000);
    return () => clearInterval(t);
  }, []);
  // Live chat: check for replies from the team (every 4s with the chat open, every 15s when closed).
  useEffect(() => {
    if (mode !== 'live' || !sessionId) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await api.get('/chat/poll', { params: { sessionId, after: lastId } });
        if (stop) return;
        const fresh: Msg[] = r.data.messages.map((m: any) => ({ id: m.id, role: m.role, text: m.text, author: m.author }));
        if (fresh.length) {
          setMsgs((cur) => [...cur, ...fresh.filter((f) => !cur.some((c) => c.id === f.id))]);
          setLastId(fresh[fresh.length - 1].id!);
          if (!openRef.current) setUnread((u) => u + fresh.filter((f) => f.role === 'agent').length);
        }
        setAgentName(r.data.agentName || undefined);
        setCfg((c) => ({ ...c, agentsOnline: r.data.agentsOnline }));
        if (r.data.mode !== 'live') setMode('bot');
      } catch { /* try again on the next tick */ }
    };
    tick();
    const t = setInterval(tick, open ? 4000 : 15000);
    return () => { stop = true; clearInterval(t); };
  }, [mode, sessionId, lastId, open]);
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

  if (!cfg.enabled) return null;

  function openChat() {
    setOpen(true); setNudge(false); setUnread(0); saved.current.nudged = true;
    if (!msgs.length) setMsgs([{ role: 'bot', text: cfg.greeting, chips: cfg.chips }]);
  }

  async function send(raw: string) {
    const message = raw.trim();
    if (!message || typing) return;
    setText('');
    setMsgs((m) => [...m, { role: 'user', text: message }]);
    setTyping(true);
    try {
      const r = await api.post('/chat', { sessionId, message, page: window.location.pathname }, { timeout: 70000 });
      setSessionId(r.data.sessionId);
      if (r.data.mode) setMode(r.data.mode);
      if (r.data.reply) setMsgs((m) => [...m, { role: 'bot', text: r.data.reply.text, chips: r.data.reply.chips, action: r.data.reply.action }]);
    } catch (x) {
      const offline = !(x as any)?.response;
      setMsgs((m) => [...m, { role: 'bot', text: offline ? `Sorry, I'm having trouble connecting right now. You can reach the team on WhatsApp (${cfg.whatsapp}) or call ${cfg.phone}.` : `${errMsg(x, 'Sorry, I could not reply just now.')} You can also reach the team on WhatsApp.`, action: { type: 'whatsapp' } }]);
    } finally { setTyping(false); }
  }

  async function startLive() {
    if (mode === 'live') return;
    try {
      const r = await api.post('/chat/live', { sessionId, page: window.location.pathname }, { timeout: 70000 });
      setSessionId(r.data.sessionId); setMode('live'); setLastId(r.data.lastId);
      setMsgs((m) => [...m, { role: 'system', text: r.data.text, id: r.data.lastId }]);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (x) { setMsgs((m) => [...m, { role: 'bot', text: `${errMsg(x)} You can reach the team on WhatsApp.`, action: { type: 'whatsapp' } }]); }
  }
  async function backToBot() {
    if (!sessionId) return;
    try { const r = await api.post('/chat/bot', { sessionId }); setMode('bot'); setLastId(r.data.lastId); setAgentName(undefined); setMsgs((m) => [...m, { role: 'system', text: r.data.text, chips: cfg.chips }]); } catch { /* ignore */ }
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
        <button className="chat-fab" onClick={openChat} aria-label={`Chat with us${cfg.agentsOnline ? ' (team online)' : ''}${unread ? `, ${unread} new message${unread > 1 ? 's' : ''}` : ''}`}>
          <Icon name="chat" size={26} /><span className="chat-fab-label">{cfg.agentsOnline ? 'Chat with us' : 'Ask us'}</span>
          {cfg.agentsOnline > 0 && <i className="chat-fab-online" aria-hidden="true" />}
          {unread > 0 && <b className="chat-fab-badge" aria-hidden="true">{unread}</b>}
        </button>
      )}
      {open && (
        <section className="chat-panel" role="dialog" aria-label={`Chat with ${cfg.name}`}>
          <header className="chat-head">
            <img src="/images/logo.webp" alt="" width={40} height={40} />
            <div>
              <b>{mode === 'live' ? (agentName ? `${agentName} · Apostle Joshua Outreach` : 'Live chat') : cfg.name}</b>
              <span><i className={`chat-dot${mode === 'live' && !agentName && !cfg.agentsOnline ? ' off' : ''}`} />
                {mode === 'live' ? (agentName ? 'Live chat with our team' : cfg.agentsOnline ? 'Team online · joining shortly' : 'Team offline · we’ll reply soon') : cfg.agentsOnline ? 'Assistant · team online now' : 'Assistant · replies instantly'}</span>
            </div>
            {mode === 'bot'
              ? <button className="chat-head-btn" onClick={startLive} aria-label="Talk to a person" title="Talk to a person"><Icon name="users" size={18} /></button>
              : <a className="chat-head-btn" href={waHref} target="_blank" rel="noreferrer" aria-label="Continue on WhatsApp" title="Continue on WhatsApp"><Icon name="phone" size={18} /></a>}
            <button className="chat-head-btn" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
          </header>
          {mode === 'live' && <div className="chat-livebar"><span><i className="live-dot" />You&rsquo;re chatting with a person</span><button onClick={backToBot}>Back to assistant</button></div>}
          <div className="chat-log" ref={logRef} aria-live="polite">
            {msgs.map((m, i) => (
              <div key={m.id ? `m${m.id}` : i} className={`chat-msg ${m.role}`}>
                {m.role === 'agent' && <small className="chat-author">{m.author || 'Team'} · Apostle Joshua Outreach</small>}
                <div className="chat-bubble"><Rich text={m.text} /></div>
                {m.action && !m.done && m.action.type === 'prayer_form' && <PrayerMini sessionId={sessionId} prefill={i === lastIdx ? lastUser : ''} onDone={(n) => markDone(i, `Thank you, ${n}. 🙏 Your prayer request has been received. Apostle Joshua and the prayer team are standing with you.`)} />}
                {m.action && !m.done && m.action.type === 'contact_form' && <ContactMini subject={m.action.subject} sessionId={sessionId} prefill={i === lastIdx ? lastUser : ''} onDone={(n) => markDone(i, `Thank you, ${n}! Your message has been sent and the team will get back to you soon.`)} />}
                {m.action?.type === 'handoff' && (
                  <div className="chat-ctas">
                    {mode === 'bot' && <button className="chat-cta" onClick={startLive}><Icon name="users" size={16} />Chat live here</button>}
                    <a className="chat-cta wa" href={waHref} target="_blank" rel="noreferrer"><Icon name="chat" size={16} />WhatsApp</a>
                  </div>
                )}
                {m.action?.type === 'whatsapp' && <a className="chat-cta wa" href={waHref} target="_blank" rel="noreferrer"><Icon name="chat" size={18} />Continue on WhatsApp</a>}
                {m.action?.type === 'call' && <div className="chat-ctas"><a className="chat-cta danger" href="tel:112">Call 112 (emergency)</a>{cfg.phone && <a className="chat-cta" href={telLink(cfg.phone)}><Icon name="phone" size={16} />Call {cfg.phone}</a>}</div>}
                {i === lastIdx && (m.role === 'bot' || m.role === 'system') && mode === 'bot' && !!m.chips?.length && !typing && (
                  <div className="chat-chips">{m.chips.map((c) => <button key={c} onClick={() => send(c)}>{c}</button>)}</div>
                )}
              </div>
            ))}
            {typing && <div className="chat-msg bot"><div className="chat-bubble chat-typing" aria-label="Typing"><i /><i /><i /></div></div>}
          </div>
          <form className="chat-input" onSubmit={(e: FormEvent) => { e.preventDefault(); send(text); }}>
            <label htmlFor="chat-text" className="sr">Type your message</label>
            <textarea id="chat-text" ref={inputRef} rows={1} value={text} maxLength={1000} placeholder={mode === 'live' ? 'Message the team…' : 'Type your message…'}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text); } }} />
            <button type="submit" disabled={!text.trim() || typing} aria-label="Send">➤</button>
          </form>
          <p className="chat-foot">{mode === 'live' ? 'Live chat with the Apostle Joshua Outreach team.' : 'Automated assistant.'} Chats are saved so our team can follow up.</p>
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
