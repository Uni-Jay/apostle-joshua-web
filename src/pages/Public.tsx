import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Rays from '../components/Rays';
import { Cover, Empty, EventRow, GalleryItem, Icon, Lightbox, SermonCard, metaLine, usePlay } from '../components/Media';
import { Loading, PageHead, useTitle } from '../components/Layout';
import { useSite } from '../context/SiteContext';
import { api, EventItem, Photo, Sermon, TYPE_LABEL, mediaUrl } from '../lib/api';
import { GRAPHICS } from '../lib/graphics';

/* ======================= ABOUT ======================= */
export function About() {
  useTitle('About');
  const { site } = useSite();
  const story = (site.story || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      <PageHead crumb="About" title={<>Revealing <em>Christ</em> to the nations</>}>Who we are, what we believe, and the man God has called to lead this outreach.</PageHead>
      <section className="band">
        <div className="wrap split wide-left">
          <div className="stack">
            <div className="head" style={{ margin: 0 }}><span className="eyebrow">Who we are</span><h2>A gospel <span className="italic">outreach</span></h2></div>
            <p className="lead">Apostle Joshua Outreach is a gospel outreach based in Ikorodu, Lagos, Nigeria. We exist to take the message of Jesus Christ beyond walls, to people and places that need to hear it.</p>
            <p>Our focus is sermons, evangelism, revival and prayer. Through crusades, teaching, prayer gatherings, seminars and conferences, and through our online platforms, we share the New Testament message with clarity, so that many come to faith and grow strong in sound doctrine.</p>
          </div>
          <aside className="verse-card" aria-label="Our commission"><div className="mark" aria-hidden="true">&ldquo;</div><p>To reveal his Son in me, that I might preach him among the heathen&hellip;</p><cite>GALATIANS 1:16 &middot; OUR COMMISSION</cite></aside>
        </div>
      </section>
      <section className="band light">
        <div className="wrap split">
          <div className="welcome-photo"><img src="/images/apostle.webp" alt="Portrait of Apostle Joshua" width={700} height={1050} loading="lazy" /></div>
          <div className="stack">
            <span className="eyebrow">Meet the Apostle</span>
            <h2 className="h2">Apostle <span className="italic">Joshua</span></h2>
            <p className="lead">Apostle Joshua leads Apostle Joshua Outreach with a call to reveal Christ to the nations and to teach the Word with clarity and conviction.</p>
            {story.length ? story.map((p, i) => <p key={i} className="muted">{p}</p>) : <p className="muted">His ministry centres on sound doctrine, fervent prayer and the transformation that follows when God&rsquo;s Word is believed and obeyed.</p>}
          </div>
        </div>
      </section>
      <section className="band">
        <div className="wrap">
          <div className="head"><span className="eyebrow">What we believe</span><h2>Built on the <span className="italic">Word</span></h2></div>
          <div className="cards">
            <article className="card"><div className="n" aria-hidden="true">01</div><h3>Scripture is the standard</h3><p>All scripture is given by inspiration of God, and every teaching is measured by it. (2 Timothy 3:16)</p></article>
            <article className="card"><div className="n" aria-hidden="true">02</div><h3>Christ is the centre</h3><p>Jesus Christ himself is the chief corner stone. Every message points to Him. (Ephesians 2:20)</p></article>
            <article className="card"><div className="n" aria-hidden="true">03</div><h3>The apostles&rsquo; doctrine</h3><p>We hold to what the apostles taught, as the early believers did. (Acts 2:42)</p></article>
            <article className="card"><div className="n" aria-hidden="true">04</div><h3>Grace that transforms</h3><p>Grace is not permission to sin; it is power over sin. (Romans 6:1&ndash;2, Titus 2:11&ndash;12)</p></article>
          </div>
        </div>
      </section>
      <section className="band scripture">
        <Rays cx={0.5} cy={1.25} />
        <div className="wrap center"><span className="eyebrow">Our vision</span>
          <blockquote style={{ maxWidth: '28ch' }}>The Gospel heard, and the Gospel seen.</blockquote>
          <p className="lead" style={{ textAlign: 'center' }}>Our first calling is to preach the Word. As God provides, our heart is also to empower people with jobs and to reach out to the needy, so that the love of Christ is shown in practical ways in Ikorodu, Lagos and beyond.</p>
        </div>
      </section>
      <section className="band light">
        <div className="wrap split">
          <div className="stack">
            <span className="eyebrow">Get involved</span><h2 className="h2">Serve with <span className="italic">us</span></h2>
            <p className="lead">We welcome people ready to serve God with loyalty, faithfulness, sincerity and commitment, at our crusades, gatherings and online.</p>
            <div className="roles"><span>Choir</span><span>Protocol</span><span>Media</span><span>And more</span></div>
            <div className="btns"><Link className="btn btn-ink" to="/contact?subject=I%20want%20to%20volunteer">Volunteer with us</Link></div>
          </div>
          <div className="cta-card"><Rays cx={1} cy={0} />
            <span className="eyebrow" style={{ position: 'relative' }}>Partner with us</span>
            <h2 style={{ position: 'relative', fontSize: 'clamp(36px,5vw,58px)' }}>Help us reach the nations</h2>
            <p className="lead" style={{ position: 'relative' }}>Your giving takes the Gospel to more towns, campuses and homes.</p>
            <div className="btns" style={{ position: 'relative' }}><Link className="btn btn-gold" to="/give">Partner with us</Link></div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ======================= SERMONS ======================= */
const FILTERS: [string, string][] = [['all', 'All'], ['sermon', 'Sermons'], ['prayer', 'Prayer'], ['service', 'Services & live'], ['teaching', 'Short clips']];
export function Sermons() {
  useTitle('Sermons');
  const { site } = useSite();
  const play = usePlay();
  const [all, setAll] = useState<Sermon[] | null>(null);
  const [err, setErr] = useState('');
  const [f, setF] = useState('all');
  const [q, setQ] = useState('');
  useEffect(() => { api.get('/sermons?limit=200').then((r) => setAll(r.data)).catch(() => { setErr('Sermons could not be loaded right now. Please try again shortly.'); setAll([]); }); }, []);
  const feat = all?.find((s) => s.featured) || all?.find((s) => s.type === 'sermon') || all?.[0];
  const list = useMemo(() => (all || []).filter((s) => (f === 'all' || s.type === f) && (!q || `${s.title} ${s.scripture || ''} ${s.description || ''}`.toLowerCase().includes(q.toLowerCase()))), [all, f, q]);
  return (
    <>
      <PageHead crumb="Sermons" title={<>Watch, listen &amp; <em>grow</em></>}>Full sermons, prayer sessions, live services and short teachings from Apostle Joshua Outreach.</PageHead>
      <section className="band">
        <div className="wrap">
          {all === null && <Loading label="Loading sermons" />}
          {feat && (
            <div className="featured">
              <Cover s={feat} />
              <div className="stack">
                <span className="eyebrow">Featured {TYPE_LABEL[feat.type].toLowerCase()}</span>
                <h3>{feat.title}</h3>
                <p className="mmeta">{metaLine(feat)}</p>
                {feat.description && <p className="lead">{feat.description}</p>}
                <div className="btns"><button className="btn btn-gold" onClick={() => play(feat)}><Icon name="video" />Watch now</button></div>
              </div>
            </div>
          )}
          <div className="toolbar">
            <div className="chips" role="group" aria-label="Filter by type">{FILTERS.map(([k, l]) => <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
            <div className="search"><label htmlFor="s-q" className="sr">Search sermons</label><Icon name="search" /><input id="s-q" type="search" placeholder="Search sermons" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          </div>
          {err && <p className="status">{err}</p>}
          {all && (list.length ? <div className="media-grid">{list.map((s) => <SermonCard key={s.id} s={s} />)}</div> : <Empty>{all.length ? 'No videos match. Try another filter or search.' : 'Sermons will appear here soon.'}</Empty>)}
          <div className="yt-band"><div><b>Never miss a message</b><p>Subscribe on YouTube to get every sermon and live stream.</p></div><a className="btn btn-gold" href={`${site.youtube_url}?sub_confirmation=1`}><Icon name="video" />Subscribe</a></div>
        </div>
      </section>
    </>
  );
}

/* ======================= LIVE ======================= */
export function Live() {
  useTitle('Live');
  const { site } = useSite();
  const id = site.live_video_id;
  return (
    <>
      <PageHead crumb="Live" title={site.live_is_on ? <>We&rsquo;re <em>live</em> now</> : <>Watch <em>live</em></>}>Join our services, prayer sessions and crusades as they happen, wherever you are.</PageHead>
      <section className="band">
        <div className="wrap stack" style={{ gap: 24 }}>
          {site.live_is_on && id ? (
            <>
              <span className="live-badge"><span className="live-dot" aria-hidden="true" />LIVE NOW</span>
              <div className="live-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`} title={site.live_title || 'Live stream'} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
              <h2 className="h2" style={{ fontSize: 'clamp(32px,5vw,54px)' }}>{site.live_title || 'Apostle Joshua Outreach Live'}</h2>
            </>
          ) : (
            <div className="offline">
              <Icon name="video" size={44} className="" />
              <h2 className="h2" style={{ fontSize: 'clamp(34px,5vw,56px)' }}>We&rsquo;re not live right now</h2>
              <p className="lead">Watch past live streams and sermons on our YouTube channel, or browse the sermon library.</p>
              <div className="btns" style={{ justifyContent: 'center' }}>
                <a className="btn btn-gold" href={`${site.youtube_url}/streams`}><Icon name="video" />Past live streams</a>
                <Link className="btn btn-line" to="/sermons">Sermon library</Link>
              </div>
            </div>
          )}
          <div className="yt-band"><div><b>Get notified when we go live</b><p>Subscribe on YouTube and tap the bell.</p></div><a className="btn btn-gold" href={`${site.youtube_url}?sub_confirmation=1`}>Subscribe</a></div>
        </div>
      </section>
    </>
  );
}

/* ======================= EVENTS ======================= */
export function Events() {
  useTitle('Events');
  const [data, setData] = useState<{ upcoming: EventItem[]; past: EventItem[] } | null>(null);
  useEffect(() => { api.get('/events').then((r) => setData(r.data)).catch(() => setData({ upcoming: [], past: [] })); }, []);
  return (
    <>
      <PageHead crumb="Events" title={<>Come and <em>encounter</em> Him</>}>Crusades, prayer gatherings, seminars and conferences. Everyone is welcome.</PageHead>
      <section className="band light">
        <div className="wrap">
          <div className="head"><span className="eyebrow">Upcoming</span><h2>What&rsquo;s <span className="italic">next</span></h2></div>
          {!data ? <Loading label="Loading events" /> : <div className="ev-list">{data.upcoming.length ? data.upcoming.map((e, i) => <EventRow key={e.id} e={e} next={i === 0} />) : <Empty>New gatherings will be announced soon. Follow us on Facebook for updates.</Empty>}</div>}
        </div>
      </section>
      <section className="band light alt2">
        <div className="wrap">
          <div className="head"><span className="eyebrow">Past events</span><h2>What God has <span className="italic">done</span></h2></div>
          {data && <div className="ev-list">{data.past.length ? data.past.map((e) => <EventRow key={e.id} e={e} />) : <Empty>Past events will be listed here.</Empty>}</div>}
        </div>
      </section>
      <section className="band alt"><div className="wrap"><div className="cta-card"><Rays cx={1} cy={0} />
        <h2 style={{ position: 'relative' }}>Host a crusade or seminar</h2><p className="lead" style={{ position: 'relative' }}>Invite Apostle Joshua to minister in your town, campus or community.</p>
        <div className="btns" style={{ position: 'relative' }}><Link className="btn btn-gold" to="/contact?subject=Invite%20Apostle%20Joshua">Send an invitation</Link></div></div></div></section>
    </>
  );
}

/* ======================= GALLERY ======================= */
const GFILTERS: [string, string][] = [['all', 'All'], ['photo', 'Photos'], ['teaching', 'Teachings'], ['scripture', 'Scriptures'], ['prayer', 'Prayer']];
export function Gallery() {
  useTitle('Gallery');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [f, setF] = useState('all');
  const [lb, setLb] = useState<number | null>(null);
  useEffect(() => { api.get('/gallery').then((r) => setPhotos(r.data)).catch(() => undefined); }, []);
  const all: GalleryItem[] = useMemo(() => [...photos.map((p) => ({ src: mediaUrl(p.url), cap: p.caption || 'Photo', cat: 'photo' })), ...GRAPHICS], [photos]);
  const list = f === 'all' ? all : all.filter((x) => x.cat === f);
  return (
    <>
      <PageHead crumb="Gallery" title={<>Moments &amp; <em>messages</em></>}>Photos from our outreaches and gatherings, and the teachings we share each week.</PageHead>
      <section className="band">
        <div className="wrap">
          <div className="chips" role="group" aria-label="Filter gallery" style={{ marginBottom: 26 }}>{GFILTERS.map(([k, l]) => <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
          {list.length ? <div className="gal">{list.map((g, i) => <button key={g.src + i} className="gitem" onClick={() => setLb(i)} aria-label={`View ${g.cap}`}><img src={g.src} alt={g.cap} loading="lazy" /><span>{g.cap}</span></button>)}</div>
            : <Empty>Photos from our outreaches will appear here soon.</Empty>}
        </div>
      </section>
      {lb !== null && <Lightbox items={list} index={lb} onClose={() => setLb(null)} />}
    </>
  );
}
