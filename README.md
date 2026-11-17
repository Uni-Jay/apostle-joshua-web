# Apostle Joshua Outreach — Website

React 18 + Vite + TypeScript website with an admin dashboard. It talks to the
[apostle-joshua-server](../apostle-joshua-server) API.

**Public pages:** Home, About, Sermons (videos, prayer sessions, clips), Live, Events (with countdown), Gallery, Devotionals, Prayer request, Partner/Give, Contact.

**Admin (`/admin`):** overview dashboard, sermons & videos, events, gallery uploads, devotionals editor, prayer-request inbox, messages, settings (contact details, live-stream switch, giving details, About story, team admins, change password), plus forgot/reset password.

## Run locally
```bash
cp .env.example .env     # point VITE_API_URL at the API
npm install
npm run dev              # http://localhost:5173
```

## Deploy
- **Render:** New → Blueprint → pick this repo (`render.yaml` includes the SPA rewrite). Set `VITE_API_URL` to the API's address.
- **Vercel:** import the repo, set `VITE_API_URL`; `vercel.json` handles page refreshes.

Remember to add the website's final address to the API's `CLIENT_URLS`.
