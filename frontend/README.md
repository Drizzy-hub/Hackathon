# SeeLess frontend

Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS.

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_BASE_URL at the backend
npm run dev
```

The backend must be running (default `http://localhost:8000`).

## Commands

| Script              | Purpose                      |
| ------------------- | ---------------------------- |
| `npm run dev`       | Dev server at localhost:3000 |
| `npm run build`     | Production build             |
| `npm run start`     | Run production build         |
| `npm run lint`      | Next/ESLint                  |
| `npm run typecheck` | `tsc --noEmit`               |

## Accessibility notes

- Every interactive element has an accessible name.
- Live-region announcements for analysis progress and new descriptions.
- No autoplay audio. Users explicitly press Play.
- Status and errors use text + icons, never color alone.
- Camera and microphone are opt-in: they only ask for permission after the user clicks a dedicated button.
- Skip-to-main-content link included.
