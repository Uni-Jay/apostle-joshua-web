import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api, Settings } from '../lib/api';

const EMPTY: Settings = { address: '', map_url: '', meeting_times: '', phone: '', whatsapp: '', email: '', story: '', giving: '', youtube_url: 'https://www.youtube.com/@apostlejoshua_outreach', facebook_url: 'https://www.facebook.com/profile.php?id=61576519587742', instagram_url: 'https://www.instagram.com/apostlejoshuaoutreach/', live_is_on: false, live_url: '', live_title: '', live_video_id: '' };
const Ctx = createContext<{ site: Settings; reload: () => void }>({ site: EMPTY, reload: () => undefined });

export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<Settings>(EMPTY);
  const reload = useCallback(() => {
    api.get('/settings').then((r) => setSite({ ...EMPTY, ...Object.fromEntries(Object.entries(r.data).filter(([, v]) => v !== '' && v !== null)) } as Settings)).catch(() => undefined);
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return <Ctx.Provider value={{ site, reload }}>{children}</Ctx.Provider>;
}
export const useSite = () => useContext(Ctx);
