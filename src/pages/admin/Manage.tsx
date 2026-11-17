import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icons';
import { Loading } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useSite } from '../../context/SiteContext';
import { api, errMsg, EventItem, fmtDate, fmtStamp, mediaUrl, Photo, Post, Sermon, TYPE_LABEL, youtubeId } from '../../lib/api';
import { DelBtn, Topbar, toast } from './AdminLayout';

const today = () => new Date().toISOString().slice(0, 10);

/* ======================= OVERVIEW ======================= */
export function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.get('/dashboard').then((r) => setD(r.data)).catch(() => setD({ error: true })); }, []);
  if (!d) return <Loading label="Loading dashboard" />;
  if (d.error) return <div className="notice err">The dashboard could not load. Check your connection and refresh.</div>;
  const c = d.counts;
  const days = c.nextEventOn ? Math.max(0, Math.ceil((new Date(c.nextEventOn + 'T00:00:00').getTime() - Date.now()) / 864e5)) : null;
  const MISS: Record<string, string> = { address: 'meeting address', meeting_times: 'meeting times', phone: 'phone number', email: 'email', story: 'Apostle Joshua’s story' };
  return (
    <>
      <Topbar title={`Welcome back, ${(user?.name || '').split(' ')[0] || 'Admin'}`} sub="Here is what is happening on the website."><Link className="btn btn-gold" to="/admin/sermons"><Icon name="plus" />Add sermon</Link></Topbar>
      <div className="stats">
        <div className="stat"><span className="k">Prayer requests</span><span className="v">{c.prayersNew}</span><span className="d">new of {c.prayersTotal} total</span></div>
        <div className="stat"><span className="k">Messages</span><span className="v">{c.messagesNew}</span><span className="d">new of {c.messagesTotal} total</span></div>
        <div className="stat"><span className="k">Videos</span><span className="v">{c.sermons}</span><span className="d">on the Sermons page</span></div>
        <div className="stat"><span className="k">Upcoming events</span><span className="v">{c.upcomingEvents}</span><span className="d">{days !== null ? `Next in ${days} day${days === 1 ? '' : 's'}` : 'Add your next gathering'}</span></div>
        <div className="stat"><span className="k">Devotionals</span><span className="v">{c.postsPublished}</span><span className="d">{c.postsDraft} draft{c.postsDraft === 1 ? '' : 's'}</span></div>
        <Link to="/admin/chat" className="stat" style={{ textDecoration: 'none', color: 'inherit', borderColor: c.chatsUrgent ? '#E23B3B' : undefined }}><span className="k">Website chats</span><span className="v">{c.chatsWeek}</span><span className="d">this week{c.chatsUnseen ? ` · ${c.chatsUnseen} unread` : ''}{c.chatsUrgent ? ' · URGENT' : ''}</span></Link>
        <div className="stat"><span className="k">Photos</span><span className="v">{c.photos}</span><span className="d">in the gallery</span></div>
      </div>
      {d.missing.length > 0 && (
        <div className="panel"><h2>To finish your website</h2><p className="hint">Add these so visitors can find and reach you: {d.missing.map((k: string) => MISS[k] || k).join(', ')}.</p><div className="btns"><Link className="btn btn-gold" to="/admin/settings">Update settings</Link></div></div>
      )}
      <div className="agrid">
        <div className="panel"><div className="panel-head"><h2>Latest prayer requests</h2><Link className="mini" to="/admin/prayer">Open inbox</Link></div>
          <div className="rows">{d.recentPrayers.length ? d.recentPrayers.map((p: any) => (
            <div key={p.id} className="arow" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}><div><b>{p.name}</b><small>{p.request.slice(0, 90)}{p.request.length > 90 ? '…' : ''}</small></div><span className={`pill ${p.status}`}>{p.status}</span></div>
          )) : <p className="hint">No prayer requests yet.</p>}</div></div>
        <div className="panel"><h2>Quick actions</h2>
          <div className="qa">
            <Link to="/admin/sermons"><Icon name="video" />Add a sermon or clip</Link>
            <Link to="/admin/events"><Icon name="cal" />Announce an event</Link>
            <Link to="/admin/blog"><Icon name="book" />Write a devotional</Link>
            <Link to="/admin/settings"><Icon name="gear" />Go live / settings</Link>
          </div></div>
      </div>
    </>
  );
}

/* ======================= SERMONS ======================= */
const EMPTY_S = { url: '', title: '', type: 'sermon', preached_on: today(), speaker: 'Apostle Joshua', duration: '', scripture: '', description: '', featured: false, date_approx: false };
export function SermonsAdmin() {
  const [list, setList] = useState<Sermon[] | null>(null);
  const [f, setF] = useState<any>(EMPTY_S);
  const [editing, setEditing] = useState<number | null>(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [q, setQ] = useState('');
  const load = useCallback(() => api.get('/sermons?limit=200').then((r) => setList(r.data)).catch(() => setList([])), []);
  useEffect(() => { load(); }, [load]);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const yid = youtubeId(f.url);
  function edit(s: Sermon) { setEditing(s.id); setF({ url: s.url, title: s.title, type: s.type, preached_on: s.preached_on || '', speaker: s.speaker, duration: s.duration || '', scripture: s.scripture || '', description: s.description || '', featured: s.featured, date_approx: s.date_approx }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function reset() { setEditing(null); setF(EMPTY_S); setErr(''); }
  async function save(e: FormEvent) {
    e.preventDefault(); setErr('');
    if (!yid) return setErr('Please paste a YouTube link (from YouTube’s Share button).');
    if (!f.title.trim()) return setErr('Please add a title.');
    setBusy(true);
    try { if (editing) await api.put(`/sermons/${editing}`, f); else await api.post('/sermons', f); toast(editing ? 'Changes saved' : 'Video published'); reset(); load(); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  }
  const shown = (list || []).filter((s) => !q || s.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Topbar title="Sermons & videos" sub="Paste a YouTube link to publish a sermon, prayer session, service or clip." />
      <div className="agrid">
        <form className="panel" onSubmit={save} noValidate>
          <h2>{editing ? 'Edit video' : 'Add a video'}</h2>
          <div className="field"><label htmlFor="s-url">YouTube link</label><input id="s-url" value={f.url} onChange={set('url')} placeholder="https://youtu.be/..." /><span className="hint">Copy it from YouTube&rsquo;s Share button.</span></div>
          {f.url && <div className="yt-preview show">{yid ? <><img src={`https://i.ytimg.com/vi/${yid}/default.jpg`} alt="" width={64} style={{ borderRadius: 6 }} /><span>Video found. <a href={`https://www.youtube.com/watch?v=${yid}`} target="_blank" rel="noreferrer">Check it on YouTube</a></span></> : <span>That doesn&rsquo;t look like a YouTube link yet.</span>}</div>}
          <div className="field"><label htmlFor="s-title">Title</label><input id="s-title" value={f.title} onChange={set('title')} /></div>
          <div className="row2">
            <div className="field"><label htmlFor="s-type">Type</label><select id="s-type" value={f.type} onChange={set('type')}>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="field"><label htmlFor="s-date">Date</label><input id="s-date" type="date" value={f.preached_on || ''} onChange={set('preached_on')} /></div>
          </div>
          <div className="row2">
            <div className="field"><label htmlFor="s-speaker">Speaker</label><input id="s-speaker" value={f.speaker} onChange={set('speaker')} /></div>
            <div className="field"><label htmlFor="s-dur">Length (optional)</label><input id="s-dur" value={f.duration} onChange={set('duration')} placeholder="e.g. 52:18" /></div>
          </div>
          <div className="field"><label htmlFor="s-scr">Scripture (optional)</label><input id="s-scr" value={f.scripture} onChange={set('scripture')} placeholder="e.g. John 11:25" /></div>
          <div className="field"><label htmlFor="s-desc">Description (optional)</label><textarea id="s-desc" value={f.description} onChange={set('description')} style={{ minHeight: 90 }} /></div>
          <label className="check"><input type="checkbox" checked={f.featured} onChange={set('featured')} />Feature this video at the top of the website</label>
          <label className="check"><input type="checkbox" checked={f.date_approx} onChange={set('date_approx')} />Only show the month (date is approximate)</label>
          {err && <div className="notice err" role="alert">{err}</div>}
          <div className="btns"><button className="btn btn-gold" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish video'}</button>{editing && <button className="btn btn-line" type="button" onClick={reset}>Cancel edit</button>}</div>
        </form>
        <div className="panel">
          <div className="panel-head"><h2>All videos</h2><span className="hint">{list?.length || 0} videos</span></div>
          <div className="search" style={{ maxWidth: 'none' }}><label htmlFor="s-q" className="sr">Search videos</label><Icon name="search" /><input id="s-q" type="search" placeholder="Search videos" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {!list ? <Loading /> : <div className="rows">{shown.length ? shown.map((s) => (
            <div key={s.id} className="arow">
              <div className="mini-cover"><img src={`https://i.ytimg.com/vi/${s.youtube_id}/default.jpg`} alt="" /></div>
              <div><b>{s.featured ? '★ ' : ''}{s.title}</b><small>{[TYPE_LABEL[s.type], fmtDate(s.preached_on, s.date_approx), s.duration].filter(Boolean).join(' · ')}</small></div>
              <div className="acts"><button className="mini" onClick={() => edit(s)}>Edit</button><DelBtn onConfirm={async () => { try { await api.delete(`/sermons/${s.id}`); toast('Video deleted'); load(); } catch (x) { toast(errMsg(x)); } }} /></div>
            </div>)) : <p className="hint">No videos yet.</p>}</div>}
        </div>
      </div>
    </>
  );
}

/* ======================= EVENTS ======================= */
const EMPTY_E = { title: '', starts_on: '', time_text: '', venue: '', description: '', is_past: false };
export function EventsAdmin() {
  const [data, setData] = useState<{ upcoming: EventItem[]; past: EventItem[] } | null>(null);
  const [f, setF] = useState<any>(EMPTY_E); const [editing, setEditing] = useState<number | null>(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.get('/events').then((r) => setData(r.data)).catch(() => setData({ upcoming: [], past: [] })), []);
  useEffect(() => { load(); }, [load]);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  function edit(ev: EventItem) { setEditing(ev.id); setF({ title: ev.title, starts_on: ev.starts_on?.slice(0, 10) || '', time_text: ev.time_text || '', venue: ev.venue || '', description: ev.description || '', is_past: !!ev.is_past }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function reset() { setEditing(null); setF(EMPTY_E); setErr(''); }
  async function save(e: FormEvent) {
    e.preventDefault(); setErr('');
    if (!f.title.trim()) return setErr('Please add the event name.');
    if (!f.starts_on && !f.is_past) return setErr('Please add the event date.');
    setBusy(true);
    try { if (editing) await api.put(`/events/${editing}`, f); else await api.post('/events', f); toast(editing ? 'Changes saved' : 'Event published'); reset(); load(); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  }
  const all = data ? [...data.upcoming, ...data.past] : [];
  return (
    <>
      <Topbar title="Events" sub="Upcoming events appear on the Home and Events pages, with a countdown to the next one." />
      <div className="agrid">
        <form className="panel" onSubmit={save} noValidate>
          <h2>{editing ? 'Edit event' : 'Add an event'}</h2>
          <div className="field"><label htmlFor="e-title">Event name</label><input id="e-title" value={f.title} onChange={set('title')} /></div>
          <div className="row2">
            <div className="field"><label htmlFor="e-date">Date</label><input id="e-date" type="date" value={f.starts_on} onChange={set('starts_on')} /></div>
            <div className="field"><label htmlFor="e-time">Time</label><input id="e-time" value={f.time_text} onChange={set('time_text')} placeholder="e.g. 9:00 AM" /></div>
          </div>
          <div className="field"><label htmlFor="e-venue">Venue</label><input id="e-venue" value={f.venue} onChange={set('venue')} placeholder="e.g. Town hall, Ikorodu" /></div>
          <div className="field"><label htmlFor="e-desc">Description</label><textarea id="e-desc" value={f.description} onChange={set('description')} style={{ minHeight: 90 }} /></div>
          <label className="check"><input type="checkbox" checked={f.is_past} onChange={set('is_past')} />This event has already happened</label>
          {err && <div className="notice err" role="alert">{err}</div>}
          <div className="btns"><button className="btn btn-gold" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish event'}</button>{editing && <button className="btn btn-line" type="button" onClick={reset}>Cancel edit</button>}</div>
        </form>
        <div className="panel"><h2>All events</h2>
          {!data ? <Loading /> : <div className="rows">{all.length ? all.map((ev) => (
            <div key={ev.id} className="arow">
              <div className="mini-date">{ev.starts_on ? <>{+ev.starts_on.slice(8, 10)}<small>{fmtDate(ev.starts_on).split(' ')[1]?.toUpperCase()}</small></> : <>&mdash;<small>PAST</small></>}</div>
              <div><b>{ev.title}</b><small>{[ev.starts_on ? fmtDate(ev.starts_on) : 'Past event', ev.venue].filter(Boolean).join(' · ')}</small></div>
              <div className="acts"><button className="mini" onClick={() => edit(ev)}>Edit</button><DelBtn onConfirm={async () => { try { await api.delete(`/events/${ev.id}`); toast('Event deleted'); load(); } catch (x) { toast(errMsg(x)); } }} /></div>
            </div>)) : <p className="hint">No events yet.</p>}</div>}
        </div>
      </div>
    </>
  );
}

/* ======================= GALLERY ======================= */
export function GalleryAdmin() {
  const [list, setList] = useState<Photo[] | null>(null);
  const [busy, setBusy] = useState(''); const [err, setErr] = useState(''); const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const load = useCallback(() => api.get('/gallery').then((r) => setList(r.data)).catch(() => setList([])), []);
  useEffect(() => { load(); }, [load]);
  async function upload(files: FileList | File[]) {
    const arr = Array.from(files).filter((x) => /^image\//.test(x.type));
    if (!arr.length) return setErr('Please choose image files (JPG, PNG or WEBP).');
    setErr('');
    for (let i = 0; i < arr.length; i += 10) {
      const fd = new FormData(); arr.slice(i, i + 10).forEach((x) => fd.append('photos', x));
      setBusy(`Uploading ${Math.min(i + 10, arr.length)} of ${arr.length}…`);
      try { await api.post('/gallery', fd); } catch (x) { setErr(errMsg(x)); break; }
    }
    setBusy(''); toast('Photos added'); load();
  }
  return (
    <>
      <Topbar title="Gallery photos" sub="Upload photos from crusades, prayer gatherings and conferences. They appear first in the Gallery." />
      <div className="panel">
        <label className={`drop${over ? ' over' : ''}`} htmlFor="g-input" onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}>
          <Icon name="up" size={32} /><b>{busy || 'Choose photos or drop them here'}</b><span className="hint">JPG, PNG or WEBP, up to 10 MB each</span>
        </label>
        <input ref={input} id="g-input" type="file" accept="image/*" multiple className="sr" onChange={(e) => { if (e.target.files) upload(e.target.files); e.target.value = ''; }} />
        {err && <div className="notice err" role="alert">{err}</div>}
        {!list ? <Loading /> : list.length ? <div className="agal">{list.map((p) => <PhotoTile key={p.id} p={p} onDeleted={load} />)}</div> : <p className="hint">No photos yet.</p>}
      </div>
    </>
  );
}
function PhotoTile({ p, onDeleted }: { p: Photo; onDeleted: () => void }) {
  const [cap, setCap] = useState(p.caption || '');
  return (
    <figure>
      <img src={mediaUrl(p.url)} alt={p.caption || 'Photo'} />
      <figcaption>
        <input aria-label="Caption" value={cap} onChange={(e) => setCap(e.target.value)} onBlur={async () => { if (cap !== (p.caption || '')) { try { await api.put(`/gallery/${p.id}`, { caption: cap }); toast('Caption saved'); } catch (x) { toast(errMsg(x)); } } }} />
        <DelBtn onConfirm={async () => { try { await api.delete(`/gallery/${p.id}`); toast('Photo removed'); onDeleted(); } catch (x) { toast(errMsg(x)); } }} />
      </figcaption>
    </figure>
  );
}

/* ======================= DEVOTIONALS ======================= */
const EMPTY_P = { title: '', scripture: '', excerpt: '', body: '', status: 'draft' };
export function BlogAdmin() {
  const [list, setList] = useState<Post[] | null>(null);
  const [f, setF] = useState<any>(EMPTY_P); const [editing, setEditing] = useState<number | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.get('/admin/posts').then((r) => setList(r.data)).catch(() => setList([])), []);
  useEffect(() => { load(); }, [load]);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  function edit(p: Post) { setEditing(p.id); setCover(null); setF({ title: p.title, scripture: p.scripture || '', excerpt: p.excerpt || '', body: p.body || '', status: p.status || 'draft' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function reset() { setEditing(null); setF(EMPTY_P); setCover(null); setErr(''); }
  async function save(status: string) {
    setErr('');
    if (!f.title.trim() || !f.body.trim()) return setErr('A title and the article text are required.');
    const fd = new FormData(); Object.entries({ ...f, status }).forEach(([k, v]) => fd.append(k, String(v))); if (cover) fd.append('cover', cover);
    setBusy(true);
    try { if (editing) await api.put(`/posts/${editing}`, fd); else await api.post('/posts', fd); toast(status === 'published' ? 'Devotional published' : 'Draft saved'); reset(); load(); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  }
  return (
    <>
      <Topbar title="Devotionals" sub="Write devotionals and teachings. Save as a draft, or publish to the website." />
      <div className="agrid">
        <form className="panel editor" onSubmit={(e) => { e.preventDefault(); save('published'); }} noValidate>
          <h2>{editing ? 'Edit devotional' : 'New devotional'}</h2>
          <div className="field"><label htmlFor="b-title">Title</label><input id="b-title" value={f.title} onChange={set('title')} /></div>
          <div className="row2">
            <div className="field"><label htmlFor="b-scr">Scripture (optional)</label><input id="b-scr" value={f.scripture} onChange={set('scripture')} placeholder="e.g. Psalm 23:1" /></div>
            <div className="field"><label htmlFor="b-cover">Cover image (optional)</label><input id="b-cover" type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} /></div>
          </div>
          <div className="field"><label htmlFor="b-ex">Short summary (optional)</label><input id="b-ex" value={f.excerpt} onChange={set('excerpt')} /></div>
          <div className="field"><label htmlFor="b-body">Devotional</label><textarea id="b-body" value={f.body} onChange={set('body')} /><span className="hint">Leave a blank line between paragraphs.</span></div>
          {err && <div className="notice err" role="alert">{err}</div>}
          <div className="btns"><button className="btn btn-gold" type="submit" disabled={busy}>Publish</button><button className="btn btn-line" type="button" disabled={busy} onClick={() => save('draft')}>Save draft</button>{editing && <button className="btn btn-line" type="button" onClick={reset}>Cancel edit</button>}</div>
        </form>
        <div className="panel"><h2>All devotionals</h2>
          {!list ? <Loading /> : <div className="rows">{list.length ? list.map((p) => (
            <div key={p.id} className="arow" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
              <div><b>{p.title}</b><small><span className={`pill ${p.status}`}>{p.status}</span> {p.published_at ? fmtDate(p.published_at) : ''}</small></div>
              <div className="acts">{p.status === 'published' && <a className="mini" href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">View</a>}<button className="mini" onClick={() => edit(p)}>Edit</button><DelBtn onConfirm={async () => { try { await api.delete(`/posts/${p.id}`); toast('Devotional deleted'); load(); } catch (x) { toast(errMsg(x)); } }} /></div>
            </div>)) : <p className="hint">No devotionals yet.</p>}</div>}
        </div>
      </div>
    </>
  );
}

/* ======================= PRAYER REQUESTS ======================= */
export function PrayerAdmin() {
  const [list, setList] = useState<any[] | null>(null); const [f, setF] = useState('');
  const load = useCallback(() => api.get(`/prayer-requests${f ? `?status=${f}` : ''}`).then((r) => setList(r.data)).catch(() => setList([])), [f]);
  useEffect(() => { load(); }, [load]);
  async function setStatus(id: number, status: string) { try { await api.patch(`/prayer-requests/${id}`, { status }); toast(`Marked as ${status}`); load(); } catch (x) { toast(errMsg(x)); } }
  return (
    <>
      <Topbar title="Prayer requests" sub="Requests sent from the website. They are private: only admins can see them." />
      <div className="chips">{[['', 'All'], ['new', 'New'], ['praying', 'Praying'], ['answered', 'Answered']].map(([k, l]) => <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
      {!list ? <Loading /> : list.length ? <div className="rows">{list.map((p) => (
        <div key={p.id} className="inbox-item">
          <div className="top"><div><b>{p.name}</b> <small>{fmtStamp(p.created_at)}</small></div><span className={`pill ${p.status}`}>{p.status}</span></div>
          <p>{p.request}</p>
          {(p.phone || p.email) && <small>{p.phone && <a href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}>{p.phone}</a>}{p.phone && p.email ? ' · ' : ''}{p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}</small>}
          <div className="acts">
            {p.status !== 'praying' && <button className="mini" onClick={() => setStatus(p.id, 'praying')}>Praying</button>}
            {p.status !== 'answered' && <button className="mini" onClick={() => setStatus(p.id, 'answered')}>Answered</button>}
            <DelBtn onConfirm={async () => { try { await api.delete(`/prayer-requests/${p.id}`); toast('Deleted'); load(); } catch (x) { toast(errMsg(x)); } }} />
          </div>
        </div>))}</div> : <div className="empty">No prayer requests here yet.</div>}
    </>
  );
}

/* ======================= MESSAGES ======================= */
export function MessagesAdmin() {
  const [list, setList] = useState<any[] | null>(null);
  const load = useCallback(() => api.get('/messages').then((r) => setList(r.data)).catch(() => setList([])), []);
  useEffect(() => { load(); }, [load]);
  return (
    <>
      <Topbar title="Messages" sub="Invitations, visit plans, volunteers and enquiries from the Contact page." />
      {!list ? <Loading /> : list.length ? <div className="rows">{list.map((m) => (
        <div key={m.id} className="inbox-item">
          <div className="top"><div><b>{m.name}</b> <small>{m.subject} · {fmtStamp(m.created_at)}</small></div><span className={`pill ${m.status}`}>{m.status}</span></div>
          <p>{m.body}</p>
          <small>{m.phone && <><a href={`https://wa.me/${m.phone.replace(/[^0-9]/g, '')}`}>WhatsApp {m.phone}</a> · <a href={`tel:${m.phone.replace(/[^0-9+]/g, '')}`}>Call</a></>}{m.phone && m.email ? ' · ' : ''}{m.email && <a href={`mailto:${m.email}`}>{m.email}</a>}</small>
          <div className="acts">
            <button className="mini" onClick={async () => { await api.patch(`/messages/${m.id}`, { status: m.status === 'read' ? 'new' : 'read' }).catch(() => undefined); load(); }}>{m.status === 'read' ? 'Mark as new' : 'Mark as read'}</button>
            <DelBtn onConfirm={async () => { try { await api.delete(`/messages/${m.id}`); toast('Deleted'); load(); } catch (x) { toast(errMsg(x)); } }} />
          </div>
        </div>))}</div> : <div className="empty">No messages yet.</div>}
    </>
  );
}

/* ======================= SETTINGS ======================= */
const SITE_FIELDS: [string, string, string?][] = [
  ['phone', 'Phone (calls)'], ['whatsapp', 'WhatsApp number'], ['email', 'Email'], ['address', 'Address or base location'],
  ['map_url', 'Google Maps link (optional)'], ['meeting_times', 'Regular gatherings (shown in the top bar)', 'e.g. Prayer: Tuesdays 6 PM'],
  ['youtube_url', 'YouTube channel link'], ['facebook_url', 'Facebook link'], ['instagram_url', 'Instagram link'],
];
export function SettingsAdmin() {
  const { reload } = useSite();
  const { user } = useAuth();
  const [s, setS] = useState<any>(null);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { api.get('/settings').then((r) => setS(r.data)).catch(() => setErr('Settings could not load.')); }, []);
  const set = (k: string) => (e: any) => setS({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  async function save(part: string[]) {
    setMsg(''); setErr('');
    try { const body: any = {}; part.forEach((k) => (body[k] = s[k])); await api.put('/settings', body); toast('Settings saved'); reload(); }
    catch (x) { setErr(errMsg(x)); }
  }
  if (!s) return <>{err ? <div className="notice err">{err}</div> : <Loading />}</>;
  return (
    <>
      <Topbar title="Settings" sub="Contact details, live stream, giving details and your account." />
      {err && <div className="notice err">{err}</div>}{msg && <div className="notice ok">{msg}</div>}
      <div className="panel" style={{ borderColor: s.live_is_on ? '#E23B3B' : undefined }}>
        <div className="panel-head"><h2>Live stream</h2>{s.live_is_on && <span className="live-badge"><span className="live-dot" />LIVE ON WEBSITE</span>}</div>
        <p className="hint">When you go live on YouTube, paste the live video&rsquo;s link and switch this on. The Live page will play it and the top bar will say you&rsquo;re live.</p>
        <div className="field"><label htmlFor="lv-url">Live video link</label><input id="lv-url" value={s.live_url || ''} onChange={set('live_url')} placeholder="https://youtube.com/live/..." /></div>
        <div className="field"><label htmlFor="lv-title">Title</label><input id="lv-title" value={s.live_title || ''} onChange={set('live_title')} /></div>
        <label className="check"><input type="checkbox" checked={!!s.live_is_on} onChange={set('live_is_on')} />Show as live on the website</label>
        <div className="btns"><button className="btn btn-gold" onClick={() => save(['live_url', 'live_title', 'live_is_on'])}>Save live settings</button></div>
      </div>
      <form className="panel" onSubmit={(e) => { e.preventDefault(); save(SITE_FIELDS.map((x) => x[0])); }} noValidate>
        <h2>Contact &amp; social links</h2>
        <div className="row2">{SITE_FIELDS.map(([k, l, ph]) => <div key={k} className="field"><label htmlFor={`st-${k}`}>{l}</label><input id={`st-${k}`} value={s[k] || ''} onChange={set(k)} placeholder={ph} /></div>)}</div>
        <div className="btns"><button className="btn btn-gold" type="submit">Save details</button></div>
      </form>
      <form className="panel" onSubmit={(e) => { e.preventDefault(); save(['story', 'giving']); }} noValidate>
        <h2>About &amp; giving</h2>
        <div className="field"><label htmlFor="st-story">Apostle Joshua&rsquo;s story (About page)</label><textarea id="st-story" value={s.story || ''} onChange={set('story')} style={{ minHeight: 150 }} /><span className="hint">Leave a blank line between paragraphs.</span></div>
        <div className="field"><label htmlFor="st-giving">Giving / partnership details (Partner page)</label><textarea id="st-giving" value={s.giving || ''} onChange={set('giving')} style={{ minHeight: 100 }} placeholder={'Bank: \nAccount name: \nAccount number: '} /></div>
        <div className="btns"><button className="btn btn-gold" type="submit">Save</button></div>
      </form>
      <AccountPanel />
      {user?.role === 'owner' && <TeamPanel />}
    </>
  );
}

function AccountPanel() {
  const [cur, setCur] = useState(''); const [nw, setNw] = useState(''); const [err, setErr] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('');
    if (nw.length < 8) return setErr('Use at least 8 characters for the new password.');
    try { await api.post('/auth/change-password', { currentPassword: cur, newPassword: nw }); setCur(''); setNw(''); toast('Password changed'); } catch (x) { setErr(errMsg(x)); }
  }
  return (
    <form className="panel" onSubmit={submit} noValidate style={{ maxWidth: 640 }}>
      <h2>Change your password</h2>
      <div className="row2">
        <div className="field"><label htmlFor="pw-cur">Current password</label><input id="pw-cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
        <div className="field"><label htmlFor="pw-new">New password</label><input id="pw-new" type="password" autoComplete="new-password" value={nw} onChange={(e) => setNw(e.target.value)} /></div>
      </div>
      {err && <div className="notice err" role="alert">{err}</div>}
      <div className="btns"><button className="btn btn-gold" type="submit">Change password</button></div>
    </form>
  );
}

function TeamPanel() {
  const [list, setList] = useState<any[]>([]);
  const [f, setF] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState('');
  const load = useCallback(() => api.get('/auth/admins').then((r) => setList(r.data)).catch(() => undefined), []);
  useEffect(() => { load(); }, [load]);
  async function add(e: FormEvent) {
    e.preventDefault(); setErr('');
    try { await api.post('/auth/admins', f); setF({ name: '', email: '', password: '' }); toast('Admin added'); load(); } catch (x) { setErr(errMsg(x)); }
  }
  return (
    <div className="panel">
      <h2>Admin team</h2>
      <p className="hint">Give your media team their own login. Share the temporary password with them privately; they can change it in Settings.</p>
      <div className="rows">{list.map((a) => (
        <div key={a.id} className="arow" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
          <div><b>{a.name}</b><small>{a.email} · {a.role === 'owner' ? 'Owner' : 'Admin'}{a.last_login ? ` · last seen ${fmtDate(a.last_login)}` : ''}</small></div>
          {a.role !== 'owner' && <DelBtn label="Remove" onConfirm={async () => { try { await api.delete(`/auth/admins/${a.id}`); toast('Admin removed'); load(); } catch (x) { toast(errMsg(x)); } }} />}
        </div>))}</div>
      <form onSubmit={add} noValidate className="stack" style={{ gap: 12 }}>
        <div className="row2">
          <div className="field"><label htmlFor="t-name">Name</label><input id="t-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="field"><label htmlFor="t-email">Email</label><input id="t-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        </div>
        <div className="field"><label htmlFor="t-pw">Temporary password</label><input id="t-pw" type="text" autoComplete="off" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        {err && <div className="notice err" role="alert">{err}</div>}
        <div className="btns"><button className="btn btn-gold" type="submit">Add admin</button></div>
      </form>
    </div>
  );
}
