import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { Icon } from './Icons';
import { VideoProvider } from './Media';

const NAV = [
  ['/', 'Home'], ['/about', 'About'], ['/sermons', 'Sermons'], ['/live', 'Live'], ['/events', 'Events'],
  ['/gallery', 'Gallery'], ['/blog', 'Devotionals'], ['/contact', 'Contact'],
];

export function Header() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  return (
    <nav className={`nav${open ? ' open' : ''}`} aria-label="Main">
      <div className="wrap">
        <Link className="brand" to="/" aria-label="Apostle Joshua Outreach home">
          <img src="/images/logo.webp" alt="" width={46} height={46} />
          <div><b>APOSTLE JOSHUA</b><span>OUTREACH</span></div>
        </Link>
        <ul className="links" id="links">
          {NAV.map(([to, label]) => (
            <li key={to}><NavLink to={to} end={to === '/'}>{label}</NavLink></li>
          ))}
        </ul>
        <Link className="btn btn-gold nav-cta" to="/prayer">Prayer request</Link>
        <button className="menu-btn" aria-expanded={open} aria-controls="links" onClick={() => setOpen(!open)}><i aria-hidden="true" />MENU</button>
      </div>
    </nav>
  );
}

function UtilBar() {
  const { site } = useSite();
  return (
    <div className="util">
      <div className="wrap">
        <span><b>Ikorodu, Lagos</b> &middot; {site.meeting_times || 'Sound Doctrine. Fervent Prayer. Transformed Lives.'}</span>
        <Link to="/live" style={{ color: 'var(--gold)' }}>{site.live_is_on ? <><span className="live-dot" aria-hidden="true" />We&rsquo;re live now: watch</> : <><Icon name="video" size={14} />Watch our live streams</>}</Link>
      </div>
    </div>
  );
}

export function Footer() {
  const { site } = useSite();
  return (
    <footer>
      <div className="wrap">
        <div className="fgrid">
          <div className="fcol">
            <Link className="brand" to="/" style={{ padding: 0, opacity: 1 }}><img src="/images/logo.webp" alt="" width={46} height={46} /><div><b>APOSTLE JOSHUA</b><span>OUTREACH</span></div></Link>
            <div className="ftag">Revealing Christ to the nations.</div>
            <p>Sound Doctrine. Fervent Prayer. Transformed Lives.</p>
          </div>
          <div className="fcol"><h4>Explore</h4><Link to="/about">About us</Link><Link to="/sermons">Sermons</Link><Link to="/events">Events</Link><Link to="/blog">Devotionals</Link><Link to="/gallery">Gallery</Link><Link to="/give">Partner with us</Link></div>
          <div className="fcol"><h4>Reach us</h4>
            {site.phone && <a href={`tel:${site.phone.replace(/[^0-9+]/g, '')}`}>Call: {site.phone}</a>}
            {site.whatsapp && <a href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, '')}`}>WhatsApp: {site.whatsapp}</a>}
            {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
            <p>{site.address || 'Ikorodu, Lagos, Nigeria'}</p>
            <Link to="/prayer">Send a prayer request</Link>
          </div>
          <div className="fcol"><h4>Follow</h4><a href={site.youtube_url}>YouTube</a><a href={site.facebook_url}>Facebook</a><a href={site.instagram_url}>Instagram</a></div>
        </div>
        <div className="fbottom"><span>&copy; {new Date().getFullYear()} Apostle Joshua Outreach</span><Link to="/admin/login" style={{ color: 'var(--mist)', textDecoration: 'none' }}>Admin login</Link></div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <VideoProvider>
      <UtilBar />
      <Header />
      <main key={loc.pathname} className="page-enter"><Outlet /></main>
      <Footer />
    </VideoProvider>
  );
}

export function PageHead({ crumb, title, children }: { crumb: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="page-head">
      <RaysLazy />
      <div className="wrap">
        <div className="crumbs"><Link to="/">Home</Link> / {crumb}</div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
    </header>
  );
}
import Rays from './Rays';
function RaysLazy() { return <Rays cx={0.9} cy={-0.1} />; }

export function Loading({ label = 'Loading' }: { label?: string }) {
  return <div className="loading" role="status"><span className="spinner" aria-hidden="true" />{label}&hellip;</div>;
}

export function useTitle(t: string) {
  useEffect(() => { document.title = t ? `${t} · Apostle Joshua Outreach` : 'Apostle Joshua Outreach'; }, [t]);
}
