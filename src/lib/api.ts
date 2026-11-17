import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5055' : '')).replace(/\/$/, '');
const TOKEN_KEY = 'ajo_admin_token';

export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 30000 });

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(t: string | null) {
  try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
}

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use((r) => r, (err) => {
  if (err?.response?.status === 401 && getToken() && location.pathname.startsWith('/admin')) {
    setToken(null);
    if (!location.pathname.startsWith('/admin/login')) location.href = '/admin/login?expired=1';
  }
  return Promise.reject(err);
});

export function errMsg(e: any, fallback = 'Something went wrong. Please try again.'): string {
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.code === 'ECONNABORTED' || e?.message === 'Network Error') return 'We could not reach the server. Check your connection and try again.';
  return fallback;
}

export function mediaUrl(u?: string | null): string {
  if (!u) return '';
  return u.startsWith('/uploads/') ? `${API_URL}${u}` : u;
}

/* ---------- Types ---------- */
export type SermonType = 'sermon' | 'prayer' | 'service' | 'teaching';
export interface Sermon { id: number; title: string; type: SermonType; youtube_id: string; speaker: string; scripture?: string | null; description?: string | null; duration?: string | null; preached_on?: string | null; date_approx: boolean; featured: boolean; url: string; thumbnail: string }
export interface EventItem { id: number; title: string; starts_on?: string | null; time_text?: string | null; venue?: string | null; description?: string | null; is_past: number }
export interface Photo { id: number; url: string; caption?: string | null; category: string }
export interface Post { id: number; title: string; slug: string; excerpt?: string | null; body?: string; scripture?: string | null; cover_url?: string | null; status?: string; published_at?: string | null }
export interface Settings { address: string; map_url: string; meeting_times: string; phone: string; whatsapp: string; email: string; story: string; giving: string; youtube_url: string; facebook_url: string; instagram_url: string; live_is_on: boolean; live_url: string; live_title: string; live_video_id: string }

export const TYPE_LABEL: Record<string, string> = { sermon: 'Sermon', prayer: 'Prayer session', service: 'Service', teaching: 'Short clip' };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDate(d?: string | null, approx = false): string {
  if (!d) return '';
  const p = String(d).slice(0, 10).split('-');
  if (p.length < 3) return String(d);
  return approx ? `${MON[+p[1] - 1]} ${p[0]}` : `${+p[2]} ${MON[+p[1] - 1]} ${p[0]}`;
}
export function monthShort(d: string) { return MON[+d.slice(5, 7) - 1]; }
export function youtubeId(u: string): string {
  const s = (u || '').trim();
  const m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : /^[A-Za-z0-9_-]{11}$/.test(s) ? s : '';
}
export function waLink(n: string) { return `https://wa.me/${n.replace(/[^0-9]/g, '')}`; }
export function telLink(n: string) { return `tel:${n.replace(/[^0-9+]/g, '')}`; }
