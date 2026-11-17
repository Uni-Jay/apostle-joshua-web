import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { EventItem, Sermon, TYPE_LABEL, fmtDate, monthShort } from '../lib/api';
import { Link } from 'react-router-dom';
import { Icon } from './Icons';

/* ---------- Video player (modal) ---------- */
const VideoCtx = createContext<(s: Sermon) => void>(() => undefined);
export const usePlay = () => useContext(VideoCtx);

export function metaLine(s: Sermon) {
  return [s.speaker, fmtDate(s.preached_on, s.date_approx), s.scripture].filter(Boolean).join(' · ');
}

export function VideoProvider({ children }: { children: ReactNode }) {
  const [cur, setCur] = useState<Sermon | null>(null);
  const last = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const play = useCallback((s: Sermon) => { last.current = document.activeElement as HTMLElement; setCur(s); }, []);
  const close = useCallback(() => { setCur(null); last.current?.focus(); }, []);
  useEffect(() => {
    if (!cur) return;
    closeBtn.current?.focus();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [cur, close]);
  return (
    <VideoCtx.Provider value={play}>
      {children}
      {cur && (
        <div className="modal open" role="dialog" aria-modal="true" aria-label={cur.title} onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="vbox">
            <div className="btns" style={{ justifyContent: 'space-between', alignItems: 'center' }}><span className="mtype">{TYPE_LABEL[cur.type]}</span><button ref={closeBtn} className="btn btn-gold" onClick={close}>Close</button></div>
            <div className="vframe"><iframe src={`https://www.youtube-nocookie.com/embed/${cur.youtube_id}?autoplay=1&rel=0`} title={cur.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
            <h3>{cur.title}</h3>
            <p className="mmeta">{metaLine(cur)}</p>
            {cur.description && <p className="lead">{cur.description}</p>}
            <div className="btns"><a className="btn btn-line" href={cur.url} target="_blank" rel="noreferrer">Open on YouTube</a></div>
          </div>
        </div>
      )}
    </VideoCtx.Provider>
  );
}

/* ---------- Cover + card ---------- */
export function Cover({ s, label }: { s: Sermon; label?: string }) {
  const play = usePlay();
  const [img, setImg] = useState(true);
  return (
    <button className={`cover${img ? ' has-img' : ''}`} type="button" aria-label={label || `Play ${s.title}`} onClick={() => play(s)}>
      {img && <img className="thumb" src={s.thumbnail} alt="" loading="lazy" onError={() => setImg(false)} />}
      {!img && <img className="logo" src="/images/logo.webp" alt="" />}
      {s.duration && <span className="dur">{s.duration}</span>}
      <span className="play" aria-hidden="true" />
      <span className="ct">{s.title}</span>
    </button>
  );
}

export function SermonCard({ s }: { s: Sermon }) {
  const ml = metaLine(s);
  return (
    <article className="mcard">
      <Cover s={s} />
      <div className="mbody">
        <span className="mtype">{TYPE_LABEL[s.type]}</span>
        <h3>{s.title}</h3>
        {ml && <div className="mmeta">{ml}</div>}
        {s.description && <p>{s.description.length > 140 ? s.description.slice(0, 140) + '…' : s.description}</p>}
      </div>
    </article>
  );
}

/* ---------- Events ---------- */
function Countdown({ date }: { date: string }) {
  const calc = () => { const ms = Math.max(0, new Date(date + 'T00:00:00').getTime() - Date.now()); return [Math.floor(ms / 864e5), Math.floor((ms % 864e5) / 36e5), Math.floor((ms % 36e5) / 6e4)]; };
  const [v, setV] = useState(calc);
  useEffect(() => { const id = setInterval(() => setV(calc()), 30000); return () => clearInterval(id); }, [date]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="countdown" aria-label="Countdown">{[['DAYS', v[0]], ['HOURS', v[1]], ['MINS', v[2]]].map(([k, n]) => <div key={k}><b>{n}</b><span>{k}</span></div>)}</div>;
}

export function EventRow({ e, next }: { e: EventItem; next?: boolean }) {
  const d = e.starts_on ? e.starts_on.slice(0, 10) : '';
  const upcoming = !e.is_past && d && d >= new Date().toISOString().slice(0, 10);
  return (
    <article className={`ev${next ? ' next' : ''}`}>
      <div className={`dt${upcoming ? '' : ' past'}`}>
        {d ? <><b>{+d.slice(8, 10)}</b><span>{monthShort(d).toUpperCase()} {d.slice(0, 4)}</span></> : <><b>PAST</b><span>EVENT</span></>}
      </div>
      <div className="stack" style={{ gap: 6 }}>
        {next && <span className="eyebrow">Next gathering</span>}
        <h3>{e.title}</h3>
        {e.description && <p>{e.description}</p>}
        {(e.venue || e.time_text) && <div className="facts">{e.venue && <span><i>WHERE</i>{e.venue}</span>}{e.time_text && <span><i>TIME</i>{e.time_text}</span>}</div>}
        {next && d && <Countdown date={d} />}
      </div>
      {upcoming && <div className="cta-col"><Link className={next ? 'btn btn-gold' : 'btn btn-line'} to={`/contact?subject=Events&event=${encodeURIComponent(e.title)}`}>Ask about it</Link></div>}
    </article>
  );
}

/* ---------- Photo viewer ---------- */
export interface GalleryItem { src: string; cap: string; cat: string }
export function Lightbox({ items, index, onClose }: { items: GalleryItem[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btn.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') setI((x) => (x - 1 + items.length) % items.length); if (e.key === 'ArrowRight') setI((x) => (x + 1) % items.length); };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [items.length, onClose]);
  const it = items[i];
  return (
    <div className="modal open" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button ref={btn} className="mbtn close" onClick={onClose}>CLOSE</button>
      <button className="mbtn prev" aria-label="Previous image" onClick={() => setI((i - 1 + items.length) % items.length)}>&larr;</button>
      <figure className="lb-fig"><img src={it.src} alt={it.cap} /><figcaption>{it.cap} ({i + 1} of {items.length})</figcaption></figure>
      <button className="mbtn next" aria-label="Next image" onClick={() => setI((i + 1) % items.length)}>&rarr;</button>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) { return <div className="empty">{children}</div>; }
export { Icon };
