import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loading } from '../../components/Layout';
import { api, errMsg, fmtStamp, plainText } from '../../lib/api';
import { DelBtn, Topbar, toast } from './AdminLayout';

const when = (d: string) => fmtStamp(d);

export default function AssistantAdmin() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'chats';
  const [status, setStatus] = useState<any>(null);
  useEffect(() => { api.get('/admin/assistant').then((r) => setStatus(r.data)).catch(() => undefined); }, []);
  return (
    <>
      <Topbar title="Chat assistant" sub="Your website assistant answers visitors 24/7, takes prayer requests and enquiries, and passes people to WhatsApp." />
      {status && (
        <div className="stats" style={{ marginBottom: 18 }}>
          <div className="stat"><span className="k">AI answers</span><span className="v" style={{ fontSize: 30 }}>{status.aiConfigured ? 'ON' : 'OFF'}</span><span className="d">{status.aiConfigured ? `Google Gemini (${status.model})` : 'Answers from your site & FAQs only'}</span></div>
          <div className="stat"><span className="k">Replies (30 days)</span><span className="v">{status.last30.replies}</span><span className="d">{status.last30.ai} written by AI</span></div>
          <div className="stat"><span className="k">Couldn&rsquo;t answer</span><span className="v">{status.last30.unanswered}</span><span className="d">sent to WhatsApp instead</span></div>
        </div>
      )}
      <div className="chips" role="tablist">
        {[['chats', 'Conversations'], ['faqs', 'Answers (FAQs)'], ['settings', 'Settings']].map(([k, l]) => (
          <button key={k} role="tab" className="chip" aria-pressed={tab === k} aria-selected={tab === k} onClick={() => setSp({ tab: k })}>{l}</button>
        ))}
      </div>
      {tab === 'chats' && <Chats />}
      {tab === 'faqs' && <Faqs />}
      {tab === 'settings' && <BotSettings aiOn={!!status?.aiConfigured} />}
    </>
  );
}

/* ---------------- Conversations ---------------- */
function Chats() {
  const [sp, setSp] = useSearchParams();
  const openId = sp.get('c');
  const [list, setList] = useState<any[] | null>(null);
  const [conv, setConv] = useState<any>(null);
  const load = useCallback(() => api.get('/admin/chats').then((r) => setList(r.data)).catch(() => setList([])), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!openId) { setConv(null); return; }
    setConv('loading');
    api.get(`/admin/chats/${openId}`).then((r) => { setConv(r.data); setList((l) => l?.map((x) => (x.id === openId ? { ...x, seen: 1 } : x)) || l); }).catch(() => setConv(null));
  }, [openId]);
  const pick = (id: string | null) => setSp(id ? { tab: 'chats', c: id } : { tab: 'chats' });
  if (!list) return <Loading />;
  return (
    <div className="agrid chat-admin">
      <div className="panel" data-hide-mobile={openId ? '1' : undefined}>
        <h2>Conversations</h2>
        {list.length ? <div className="rows">{list.map((c) => (
          <button key={c.id} className={`arow chat-row${c.id === openId ? ' on' : ''}`} style={{ gridTemplateColumns: 'minmax(0,1fr) auto', textAlign: 'left' }} onClick={() => pick(c.id)}>
            <div><b>{c.urgent ? '⚠️ ' : ''}{c.name || c.phone || c.email || 'Visitor'}</b><small>{(c.first_message || '').slice(0, 70)}</small></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <small>{when(c.last_at)}</small>{!c.seen && <span className="pill new">new</span>}{!!c.urgent && <span className="pill urgent">urgent</span>}
            </div>
          </button>))}</div> : <p className="hint">No conversations yet. They will appear here as visitors chat on the website.</p>}
      </div>
      <div className="panel" data-hide-mobile={openId ? undefined : '1'}>
        {!openId ? <p className="hint">Choose a conversation to read it.</p> : conv === 'loading' ? <Loading /> : conv ? (
          <>
            <div className="panel-head">
              <h2>{conv.session.name || 'Visitor'}</h2>
              <div className="acts"><button className="mini" onClick={() => pick(null)}>Back</button>
                <DelBtn onConfirm={async () => { try { await api.delete(`/admin/chats/${openId}`); toast('Conversation deleted'); pick(null); load(); } catch (x) { toast(errMsg(x)); } }} /></div>
            </div>
            <p className="hint">
              Started {when(conv.session.created_at)}{conv.session.page ? ` on ${conv.session.page}` : ''}.
              {conv.session.phone && <> · <a href={`https://wa.me/${conv.session.phone.replace(/^0/, '234').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">WhatsApp {conv.session.phone}</a></>}
              {conv.session.email && <> · <a href={`mailto:${conv.session.email}`}>{conv.session.email}</a></>}
            </p>
            <div className="transcript">{conv.messages.map((m: any) => (
              <div key={m.id} className={`tmsg ${m.role}`}><div>{plainText(m.text)}</div><small>{m.role === 'user' ? 'Visitor' : m.source === 'ai' ? 'Assistant (AI)' : m.source === 'form' ? 'Form sent' : 'Assistant'} · {fmtStamp(m.created_at).split(', ')[1]}</small></div>
            ))}</div>
          </>
        ) : <div className="notice err">Conversation not found.</div>}
      </div>
    </div>
  );
}

/* ---------------- FAQs ---------------- */
const EMPTY = { question: '', answer: '', keywords: '', active: true, sort_order: 0 };
function Faqs() {
  const [list, setList] = useState<any[] | null>(null);
  const [f, setF] = useState<any>(EMPTY); const [editing, setEditing] = useState<number | null>(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.get('/admin/faqs').then((r) => setList(r.data)).catch(() => setList([])), []);
  useEffect(() => { load(); }, [load]);
  function reset() { setF(EMPTY); setEditing(null); setErr(''); }
  async function save(e: FormEvent) {
    e.preventDefault(); setErr('');
    if (!f.question.trim() || !f.answer.trim()) return setErr('Please add the question and the answer.');
    setBusy(true);
    try { if (editing) await api.put(`/admin/faqs/${editing}`, f); else await api.post('/admin/faqs', f); toast('Answer saved'); reset(); load(); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  }
  return (
    <div className="agrid">
      <form className="panel" onSubmit={save} noValidate>
        <h2>{editing ? 'Edit answer' : 'Teach the assistant'}</h2>
        <p className="hint">Add questions people often ask. The assistant uses your exact answer when a visitor&rsquo;s message contains one of the keywords.</p>
        <div className="field"><label htmlFor="fq-q">Question</label><input id="fq-q" value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} placeholder="e.g. Is the crusade free to attend?" /></div>
        <div className="field"><label htmlFor="fq-a">Answer</label><textarea id="fq-a" value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} style={{ minHeight: 110 }} /><span className="hint">Links work like this: [Events page](/events)</span></div>
        <div className="field"><label htmlFor="fq-k">Keywords (comma-separated)</label><input id="fq-k" value={f.keywords} onChange={(e) => setF({ ...f, keywords: e.target.value })} placeholder="free, fee, pay to attend, ticket" /></div>
        <label className="check"><input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Active</label>
        {err && <div className="notice err" role="alert">{err}</div>}
        <div className="btns"><button className="btn btn-gold" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add answer'}</button>{editing && <button className="btn btn-line" type="button" onClick={reset}>Cancel edit</button>}</div>
      </form>
      <div className="panel"><h2>Saved answers</h2>
        {!list ? <Loading /> : <div className="rows">{list.length ? list.map((q) => (
          <div key={q.id} className="arow" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
            <div><b>{q.question}</b><small>{q.active ? '' : 'Hidden · '}{q.keywords}</small></div>
            <div className="acts"><button className="mini" onClick={() => { setEditing(q.id); setF({ question: q.question, answer: q.answer, keywords: q.keywords || '', active: !!q.active, sort_order: q.sort_order }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
              <DelBtn onConfirm={async () => { try { await api.delete(`/admin/faqs/${q.id}`); toast('Deleted'); load(); } catch (x) { toast(errMsg(x)); } }} /></div>
          </div>)) : <p className="hint">No answers yet.</p>}</div>}
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
function BotSettings({ aiOn }: { aiOn: boolean }) {
  const [s, setS] = useState<any>(null); const [err, setErr] = useState('');
  useEffect(() => { api.get('/settings').then((r) => setS(r.data)).catch(() => setErr('Settings could not load.')); }, []);
  async function save(e: FormEvent) {
    e.preventDefault(); setErr('');
    try { await api.put('/settings', { bot_enabled: s.bot_enabled, bot_name: s.bot_name, bot_greeting: s.bot_greeting }); toast('Assistant settings saved'); }
    catch (x) { setErr(errMsg(x)); }
  }
  if (!s) return err ? <div className="notice err">{err}</div> : <Loading />;
  return (
    <div className="agrid">
      <form className="panel" onSubmit={save} noValidate>
        <h2>Assistant settings</h2>
        <label className="check"><input type="checkbox" checked={!!s.bot_enabled} onChange={(e) => setS({ ...s, bot_enabled: e.target.checked })} />Show the chat assistant on the website</label>
        <div className="field"><label htmlFor="bt-name">Assistant name</label><input id="bt-name" value={s.bot_name || ''} onChange={(e) => setS({ ...s, bot_name: e.target.value })} placeholder="Outreach Assistant" /></div>
        <div className="field"><label htmlFor="bt-greet">Welcome message</label><textarea id="bt-greet" value={s.bot_greeting || ''} onChange={(e) => setS({ ...s, bot_greeting: e.target.value })} style={{ minHeight: 100 }} placeholder="Hello, and welcome! 🙌 I can tell you about upcoming events, share a message to watch, take your prayer request, or connect you with our team. How can I help?" /></div>
        {err && <div className="notice err" role="alert">{err}</div>}
        <div className="btns"><button className="btn btn-gold" type="submit">Save</button></div>
      </form>
      <div className="panel">
        <h2>What runs automatically</h2>
        <ul className="auto-list">
          <li><b>Prayer requests and messages</b> sent in the chat go straight into your inboxes and are emailed to you.</li>
          <li><b>Thank-you emails</b> go to visitors who leave an email address.</li>
          <li><b>Contact details</b> typed in the chat are saved, and you get an email with the conversation.</li>
          <li><b>Urgent chats</b> (someone may be in danger) get emergency guidance at once, and you get an URGENT email.</li>
          <li><b>WhatsApp handover</b>: visitors can continue with your team, with their question already typed.</li>
          <li><b>Always up to date</b>: new events, videos and contact details are known to the assistant straight away.</li>
          <li><b>Housekeeping</b>: conversations older than 6 months are deleted automatically.</li>
        </ul>
        <h2 style={{ marginTop: 18 }}>AI answers: {aiOn ? 'on' : 'off'}</h2>
        <p className="hint">{aiOn
          ? 'Questions your FAQs don’t cover are answered by Google Gemini (free tier), using only your website’s information.'
          : 'To let the assistant answer any question, create a free Google Gemini API key at aistudio.google.com (no card needed) and add it on Render as GEMINI_API_KEY. Without it, the assistant still answers from your events, videos, settings and FAQs.'}</p>
      </div>
    </div>
  );
}
