import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Empty, Icon } from '../components/Media';
import { Loading, PageHead, useTitle } from '../components/Layout';
import { useSite } from '../context/SiteContext';
import { api, errMsg, fmtDate, mediaUrl, Post, telLink, waLink } from '../lib/api';
import { PostCard } from './Home';

/* ======================= BLOG ======================= */
export function Blog() {
  useTitle('Devotionals');
  const [posts, setPosts] = useState<Post[] | null>(null);
  useEffect(() => { api.get('/posts?limit=100').then((r) => setPosts(r.data)).catch(() => setPosts([])); }, []);
  return (
    <>
      <PageHead crumb="Devotionals" title={<>Read &amp; <em>reflect</em></>}>Devotionals and teachings from Apostle Joshua to strengthen your walk with God.</PageHead>
      <section className="band">
        <div className="wrap">{!posts ? <Loading /> : posts.length ? <div className="posts">{posts.map((p) => <PostCard key={p.id} p={p} />)}</div> : <Empty>New devotionals are coming soon.</Empty>}</div>
      </section>
    </>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const [p, setP] = useState<Post | null | undefined>(undefined);
  useTitle(p?.title || 'Devotional');
  useEffect(() => { api.get(`/posts/${slug}`).then((r) => setP(r.data)).catch(() => setP(null)); }, [slug]);
  if (p === undefined) return <section className="band"><div className="wrap"><Loading /></div></section>;
  if (p === null) return <NotFound />;
  return (
    <>
      <PageHead crumb="Devotionals" title={p.title}>{[fmtDate(p.published_at), p.scripture].filter(Boolean).join(' · ')}</PageHead>
      <section className="band light">
        <article className="article">
          {p.cover_url && <img className="cover" src={mediaUrl(p.cover_url)} alt="" style={{ borderRadius: 20 }} />}
          <div className="body">{(p.body || '').split(/\n\s*\n/).map((t, i) => <p key={i}>{t}</p>)}</div>
          <p className="signoff">&mdash; Apostle Joshua</p>
          <div className="btns"><Link className="btn btn-line" to="/blog">More devotionals</Link><Link className="btn btn-ink" to="/prayer">Send a prayer request</Link></div>
        </article>
      </section>
    </>
  );
}

/* ======================= PRAYER REQUEST ======================= */
export function Prayer() {
  useTitle('Prayer request');
  const [form, setForm] = useState({ name: '', phone: '', email: '', request: '', website: '' });
  const [state, setState] = useState<{ busy?: boolean; ok?: string; err?: string }>({});
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.request.trim().length < 5) return setState({ err: 'Please add your name and your prayer request.' });
    setState({ busy: true });
    try { const r = await api.post('/prayer-requests', form); setState({ ok: r.data.message }); setForm({ name: '', phone: '', email: '', request: '', website: '' }); }
    catch (x) { setState({ err: errMsg(x) }); }
  }
  return (
    <>
      <PageHead crumb="Prayer request" title={<>We will <em>pray</em> with you</>}>Share your request with us. Our prayer team reads every request and keeps it confidential.</PageHead>
      <section className="band">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <form className="form" onSubmit={submit} noValidate>
            <div className="hp" aria-hidden="true"><label htmlFor="p-web">Website</label><input id="p-web" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></div>
            <div className="field"><label htmlFor="p-name">Your name</label><input id="p-name" autoComplete="name" value={form.name} onChange={set('name')} required /></div>
            <div className="row2">
              <div className="field"><label htmlFor="p-phone">Phone / WhatsApp (optional)</label><input id="p-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} /></div>
              <div className="field"><label htmlFor="p-email">Email (optional)</label><input id="p-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} /></div>
            </div>
            <div className="field"><label htmlFor="p-req">Your prayer request</label><textarea id="p-req" value={form.request} onChange={set('request')} required /></div>
            {state.err && <div className="notice err" role="alert">{state.err}</div>}
            {state.ok && <div className="notice ok" role="status">{state.ok}</div>}
            <button className="btn btn-gold" type="submit" disabled={state.busy} style={{ alignSelf: 'flex-start' }}><Icon name="heart" />{state.busy ? 'Sending…' : 'Send prayer request'}</button>
          </form>
          <aside className="verse-card"><div className="mark" aria-hidden="true">&ldquo;</div><p>The effectual fervent prayer of a righteous man availeth much.</p><cite>JAMES 5:16</cite></aside>
        </div>
      </section>
    </>
  );
}

/* ======================= GIVE ======================= */
export function Give() {
  useTitle('Partner with us');
  const { site } = useSite();
  return (
    <>
      <PageHead crumb="Partner with us" title={<>Help us reach the <em>nations</em></>}>Your giving takes the Gospel to more towns, campuses and homes through crusades, teaching and outreach.</PageHead>
      <section className="band light">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <div className="stack">
            <span className="eyebrow">How to give</span>
            <h2 className="h2">Partner with the <span className="italic">outreach</span></h2>
            {site.giving ? <div className="bank">{site.giving}</div>
              : <p className="lead">To partner with the outreach, send us a message and we will share how you can give.</p>}
            <div className="btns"><Link className="btn btn-ink" to="/contact?subject=Partnership">Talk to us about partnering</Link></div>
          </div>
          <aside className="verse-card" style={{ background: 'var(--ink)', color: 'var(--cream)' }}><div className="mark" aria-hidden="true">&ldquo;</div><p>How shall they hear without a preacher? And how shall they preach, except they be sent?</p><cite>ROMANS 10:14&ndash;15</cite></aside>
        </div>
      </section>
    </>
  );
}

/* ======================= CONTACT ======================= */
const SUBJECTS = ['General enquiry', 'Planning a visit', 'I want to volunteer', 'Invite Apostle Joshua', 'Events', 'Partnership'];
export function Contact() {
  useTitle('Contact');
  const { site } = useSite();
  const [sp] = useSearchParams();
  const initialSubject = SUBJECTS.includes(sp.get('subject') || '') ? (sp.get('subject') as string) : 'General enquiry';
  const ev = sp.get('event');
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: initialSubject, body: ev ? `I'd like to know more about ${ev}.` : '', website: '' });
  const [state, setState] = useState<{ busy?: boolean; ok?: string; err?: string }>({});
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.body.trim()) return setState({ err: 'Please add your name and your message.' });
    if (!form.phone.trim() && !form.email.trim()) return setState({ err: 'Please add a phone number or email so we can reply.' });
    setState({ busy: true });
    try { const r = await api.post('/messages', form); setState({ ok: r.data.message }); setForm({ ...form, body: '' }); }
    catch (x) { setState({ err: errMsg(x) }); }
  }
  return (
    <>
      <PageHead crumb="Contact" title={<>We&rsquo;d love to <em>hear from you</em></>}>Invite Apostle Joshua, ask about an event, volunteer, or simply say hello.</PageHead>
      <section className="band">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <form className="form" onSubmit={submit} noValidate>
            <div className="hp" aria-hidden="true"><label htmlFor="c-web">Website</label><input id="c-web" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></div>
            <div className="row2">
              <div className="field"><label htmlFor="c-name">Your name</label><input id="c-name" autoComplete="name" value={form.name} onChange={set('name')} required /></div>
              <div className="field"><label htmlFor="c-subject">Subject</label><select id="c-subject" value={form.subject} onChange={set('subject')}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div className="row2">
              <div className="field"><label htmlFor="c-phone">Phone / WhatsApp</label><input id="c-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} /></div>
              <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} /></div>
            </div>
            <div className="field"><label htmlFor="c-body">Message</label><textarea id="c-body" value={form.body} onChange={set('body')} required /></div>
            {state.err && <div className="notice err" role="alert">{state.err}</div>}
            {state.ok && <div className="notice ok" role="status">{state.ok}</div>}
            <button className="btn btn-gold" type="submit" disabled={state.busy} style={{ alignSelf: 'flex-start' }}>{state.busy ? 'Sending…' : 'Send message'}</button>
          </form>
          <div className="info">
            {site.phone && <div className="info-item"><div className="ico"><Icon name="phone" /></div><div><h3>Call us</h3><p><a href={telLink(site.phone)}>{site.phone}</a></p></div></div>}
            {site.whatsapp && <div className="info-item"><div className="ico"><Icon name="chat" /></div><div><h3>WhatsApp</h3><p><a href={waLink(site.whatsapp)}>{site.whatsapp}</a></p><p>Tap to chat with us on WhatsApp.</p></div></div>}
            {site.email && <div className="info-item"><div className="ico"><Icon name="mail" /></div><div><h3>Email</h3><p><a href={`mailto:${site.email}`}>{site.email}</a></p></div></div>}
            <div className="info-item"><div className="ico"><Icon name="pin" /></div><div><h3>Where</h3><p>{site.address || 'Ikorodu, Lagos, Nigeria'}</p>{site.map_url && <p><a href={site.map_url}>Get directions</a></p>}</div></div>
            {site.meeting_times && <div className="info-item"><div className="ico"><Icon name="clock" /></div><div><h3>When we gather</h3><p>{site.meeting_times}</p></div></div>}
            <div className="socials">
              <a className="soc" href={site.youtube_url}><Icon name="video" /><div><b>YouTube</b><span>@apostlejoshua_outreach</span></div></a>
              <a className="soc" href={site.facebook_url}><Icon name="globe" /><div><b>Facebook</b><span>Apostle Joshua Outreach</span></div></a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function NotFound() {
  useTitle('Page not found');
  return (
    <section className="band"><div className="wrap stack" style={{ alignItems: 'flex-start' }}>
      <span className="eyebrow">404</span><h1 className="h2">Page not <span className="italic">found</span></h1>
      <p className="lead">The page you were looking for has moved or no longer exists.</p>
      <div className="btns"><Link className="btn btn-gold" to="/">Go home</Link><Link className="btn btn-line" to="/sermons">Watch sermons</Link></div>
    </div></section>
  );
}
