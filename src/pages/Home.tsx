import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Rays from '../components/Rays';
import { Cover, Empty, EventRow, GalleryItem, Icon, Lightbox, SermonCard, metaLine, usePlay } from '../components/Media';
import { useTitle } from '../components/Layout';
import { useSite } from '../context/SiteContext';
import { api, EventItem, Photo, Post, Sermon, fmtDate, mediaUrl } from '../lib/api';
import { GRAPHICS } from '../lib/graphics';

export default function Home() {
  useTitle('');
  const { site } = useSite();
  const play = usePlay();
  const [sermons, setSermons] = useState<Sermon[] | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [lb, setLb] = useState<number | null>(null);

  useEffect(() => {
    api.get('/sermons?limit=7').then((r) => setSermons(r.data)).catch(() => setSermons([]));
    api.get('/events').then((r) => setEvents(r.data.upcoming)).catch(() => undefined);
    api.get('/gallery').then((r) => setPhotos(r.data)).catch(() => undefined);
    api.get('/posts?limit=3').then((r) => setPosts(r.data)).catch(() => undefined);
  }, []);

  const latest = sermons?.find((s) => s.featured) || sermons?.find((s) => s.type === 'sermon') || sermons?.[0];
  const grid = (sermons || []).filter((s) => s !== latest).slice(0, 3);
  const gal: GalleryItem[] = [...photos.map((p) => ({ src: mediaUrl(p.url), cap: p.caption || 'Photo', cat: 'photo' })), ...GRAPHICS].slice(0, 4);

  return (
    <>
      <header className="hero">
        <Rays cx={0.72} cy={0.34} />
        <div className="wrap">
          <div className="hero-copy">
            <span className="eyebrow">An outreach for the nations</span>
            <h1>Revealing <em>Christ</em> to the nations</h1>
            <p className="sub">A gospel outreach from Ikorodu, Lagos, taking the New Testament message to people everywhere through teaching, crusades, prayer and conferences.</p>
            <blockquote>&ldquo;To reveal his Son in me, that I might preach him among the heathen&hellip;&rdquo;<cite>GALATIANS 1:16</cite></blockquote>
            <div className="btns">
              <Link className="btn btn-gold" to="/sermons"><Icon name="video" />Watch sermons</Link>
              <Link className="btn btn-line" to="/prayer">Send a prayer request</Link>
            </div>
          </div>
          <div className="portrait">
            <div className="halo" aria-hidden="true" /><div className="ring2" aria-hidden="true" /><div className="ring" aria-hidden="true" />
            <img src="/images/apostle-cut.webp" alt="Apostle Joshua" width={760} height={1056} />
            <div className="name"><b>APOSTLE JOSHUA</b><span>GALATIANS 1:16</span></div>
          </div>
        </div>
      </header>

      <div className="now"><div className="wrap">
        {latest && (
          <div className="now-card">
            <Cover s={latest} />
            <div className="stack" style={{ gap: 6 }}><span className="eyebrow">Latest message</span><h3>{latest.title}</h3><div className="mmeta">{metaLine(latest)}</div></div>
            <button className="btn btn-gold" onClick={() => play(latest)}><Icon name="video" />Watch now</button>
          </div>
        )}
      </div></div>

      <section className="band light" style={{ paddingTop: 'clamp(90px,11vw,140px)' }}>
        <div className="wrap split">
          <div className="welcome-photo">
            <img src="/images/apostle.webp" alt="Apostle Joshua" width={700} height={1050} loading="lazy" />
            <div className="badge"><b>APOSTLE JOSHUA</b><span>APOSTLE JOSHUA OUTREACH</span></div>
          </div>
          <div className="stack">
            <span className="eyebrow">A word of welcome</span>
            <h2 className="h2">Christ, <span className="italic">revealed</span> to you</h2>
            <p className="lead">In a time of many voices, we believe people are set free and kept steady by the Word: rightly taught, prayerfully received and faithfully lived.</p>
            <p className="muted">Apostle Joshua Outreach is a gospel outreach with one commission: to reveal Christ to the nations. We go where people are, through teaching, crusades, prayer gatherings, seminars and conferences, so that many hear the Gospel, come to Jesus and grow strong in Him.</p>
            <div className="btns"><Link className="btn btn-line" to="/about">About the outreach</Link></div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="head"><span className="eyebrow">Latest messages</span><h2>Sermons &amp; <span className="italic">clips</span></h2></div>
          {sermons === null ? null : grid.length ? <div className="media-grid">{grid.map((s) => <SermonCard key={s.id} s={s} />)}</div> : <Empty>New sermons are on the way. Subscribe on YouTube so you don&rsquo;t miss them.</Empty>}
          <div className="btns" style={{ marginTop: 30 }}><Link className="btn btn-gold" to="/sermons">All sermons</Link><a className="btn btn-line" href={`${site.youtube_url}?sub_confirmation=1`}>Subscribe on YouTube</a></div>
        </div>
      </section>

      <section className="band light alt2">
        <div className="wrap">
          <div className="head center"><span className="eyebrow">How we reach people</span><h2>Our <span className="italic">mission</span> in action</h2></div>
          <div className="mins">
            <article className="min"><div className="ico"><Icon name="mega" /></div><h3>Crusades</h3><p>Taking the Gospel into towns, campuses and communities so that many come to know Jesus.</p></article>
            <article className="min"><div className="ico"><Icon name="book" /></div><h3>Teaching</h3><p>Clear, Bible-based teaching of sound apostolic doctrine, online and in our gatherings.</p></article>
            <article className="min"><div className="ico"><Icon name="flame" /></div><h3>Prayer</h3><p>Prayer gatherings like <em>12 Hours With God</em>, and prayer for everyone who reaches out to us.</p></article>
            <article className="min"><div className="ico"><Icon name="users" /></div><h3>Seminars &amp; Conferences</h3><p>In-depth gatherings that equip believers to live and share the Gospel with conviction.</p></article>
          </div>
        </div>
      </section>

      <section className="band scripture">
        <Rays cx={0.5} cy={1.25} />
        <div className="wrap center">
          <span className="eyebrow">The Word for today</span>
          <blockquote>&ldquo;Heaven and earth shall pass away, but my words shall not pass away.&rdquo;</blockquote>
          <cite>MATTHEW 24:35</cite>
        </div>
      </section>

      <section className="band light">
        <div className="wrap">
          <div className="head"><span className="eyebrow">Gatherings</span><h2>Come and <span className="italic">encounter</span> Him</h2></div>
          <div className="ev-list">{events.length ? events.slice(0, 2).map((e, i) => <EventRow key={e.id} e={e} next={i === 0} />) : <Empty>New gatherings will be announced soon.</Empty>}</div>
          <div className="btns" style={{ marginTop: 26 }}><Link className="btn btn-line" to="/events">All events</Link></div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="band alt">
          <div className="wrap">
            <div className="head"><span className="eyebrow">Devotionals</span><h2>Read &amp; <span className="italic">reflect</span></h2></div>
            <div className="posts">{posts.map((p) => <PostCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}

      <section className="band">
        <div className="wrap">
          <div className="head"><span className="eyebrow">Gallery</span><h2>Grow in the <span className="italic">Word</span></h2></div>
          <div className="strip-gal">{gal.map((g, i) => <button key={g.src} className="gitem" onClick={() => setLb(i)} aria-label={`View ${g.cap}`}><img src={g.src} alt={g.cap} loading="lazy" /><span>{g.cap}</span></button>)}</div>
          <div className="btns" style={{ marginTop: 26 }}><Link className="btn btn-line" to="/gallery">Open gallery</Link></div>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap connect">
          <div className="cta-card">
            <Rays cx={1} cy={0} />
            <span className="eyebrow" style={{ position: 'relative' }}>We will stand with you</span>
            <h2 style={{ position: 'relative' }}>Need prayer?</h2>
            <p className="lead" style={{ position: 'relative' }}>Send us your prayer request. Our team will pray with you, and we keep every request confidential.</p>
            <div className="btns" style={{ position: 'relative' }}><Link className="btn btn-gold" to="/prayer"><Icon name="heart" />Send a prayer request</Link></div>
          </div>
          <div className="stack">
            <span className="eyebrow">Stay connected</span>
            <div className="socials">
              <a className="soc" href={site.youtube_url}><Icon name="video" /><div><b>YouTube</b><span>@apostlejoshua_outreach</span></div></a>
              <a className="soc" href={site.facebook_url}><Icon name="globe" /><div><b>Facebook</b><span>Apostle Joshua Outreach</span></div></a>
              <a className="soc" href={site.instagram_url}><Icon name="cam" /><div><b>Instagram</b><span>@apostlejoshuaoutreach</span></div></a>
              {site.whatsapp ? <a className="soc" href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, '')}`}><Icon name="chat" /><div><b>WhatsApp</b><span>{site.whatsapp}</span></div></a>
                : <Link className="soc" to="/contact"><Icon name="chat" /><div><b>Message us</b><span>Visits, invitations</span></div></Link>}
            </div>
          </div>
        </div>
      </section>
      {lb !== null && <Lightbox items={gal} index={lb} onClose={() => setLb(null)} />}
    </>
  );
}

export function PostCard({ p }: { p: Post }) {
  return (
    <Link className="post-card" to={`/blog/${p.slug}`}>
      <div className="pc-cover">{p.cover_url ? <img src={mediaUrl(p.cover_url)} alt="" loading="lazy" /> : <span className="vs">{p.scripture || 'Devotional'}</span>}</div>
      <div className="pc-body"><span className="mmeta">{fmtDate(p.published_at)}</span><h3>{p.title}</h3>{p.excerpt && <p>{p.excerpt}</p>}</div>
    </Link>
  );
}
