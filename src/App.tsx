import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { About, Events, Gallery, Live, Sermons } from './pages/Public';
import { Blog, BlogPost, Contact, Give, NotFound, Prayer } from './pages/Public2';
import AdminLayout, { ForgotPassword, Login, RequireAdmin, ResetPassword } from './pages/admin/AdminLayout';
import { BlogAdmin, Dashboard, EventsAdmin, GalleryAdmin, MessagesAdmin, PrayerAdmin, SermonsAdmin, SettingsAdmin } from './pages/admin/Manage';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="sermons" element={<Sermons />} />
          <Route path="live" element={<Live />} />
          <Route path="events" element={<Events />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="prayer" element={<Prayer />} />
          <Route path="give" element={<Give />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin/login" element={<Login />} />
        <Route path="admin/forgot-password" element={<ForgotPassword />} />
        <Route path="admin/reset-password" element={<ResetPassword />} />
        <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="sermons" element={<SermonsAdmin />} />
          <Route path="events" element={<EventsAdmin />} />
          <Route path="gallery" element={<GalleryAdmin />} />
          <Route path="blog" element={<BlogAdmin />} />
          <Route path="prayer" element={<PrayerAdmin />} />
          <Route path="messages" element={<MessagesAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Route>
      </Routes>
    </>
  );
}
