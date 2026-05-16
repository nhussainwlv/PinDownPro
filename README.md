# Pin Down Pro

Premium Pinterest media downloader — HD videos, images, GIFs, and carousels with a luxurious dark SaaS UI.

Built by [@Adrian](https://instagram.com/adrian_ash)

## Features

- **Instant downloads** — Paste `pin.it` or `pinterest.com/pin/...` links
- **Multi-format** — Video (up to 4K), images, GIFs, carousel slides
- **Live preview** — Progress loaders, drag-and-drop URL support
- **Auth & dashboard** — Download history, favorites (NextAuth + Prisma)
- **Stripe subscriptions** — Free, Pro, Enterprise tiers
- **AI captions** — OpenAI-powered tags & captions (Pro+)
- **Admin analytics** — Usage stats for admin users
- **i18n** — English, Spanish, French, German, Portuguese
- **PWA** — Installable, offline-friendly shell
- **Security** — Rate limiting, CDN proxy allowlist, security headers

## Tech Stack

- Next.js 15+ (App Router) · TypeScript · Tailwind CSS v4
- Framer Motion · shadcn-style UI components
- Prisma · PostgreSQL
- NextAuth.js v5 · Stripe · OpenAI

## Quick Start

### 1. Clone & install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Local dev uses **SQLite** (`prisma/dev.db`, via `DATABASE_URL="file:./dev.db"`) — no PostgreSQL install needed.

### 3. Database

```bash
npm run setup
```

This runs `prisma db push` and creates `prisma/dev.db`.

### 4. Run

```bash
npm run dev
```

> **Note:** Do not paste shell comments on the same line as commands in zsh (e.g. avoid `npm run dev # comment` — the `#` can cause `unknown sort specifier` errors).

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub and import in [Vercel](https://vercel.com).
2. Add environment variables from `.env.example`.
3. Attach **Vercel Postgres** (or Neon/Supabase) and set `DATABASE_URL`.
4. Run migrations: `npx prisma migrate deploy` (or use Vercel build command).
5. Configure Stripe webhook: `https://your-domain.com/api/stripe/webhook`

### Build command

```bash
prisma generate && prisma migrate deploy && next build
```

## Admin Access

Set a user's role to `ADMIN` in the database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

## PWA Icons

Add `public/icons/icon-192.png` and `public/icons/icon-512.png` for full PWA support (manifest is preconfigured).

## Project Structure

```
src/
  app/
    [locale]/          # i18n routes
    api/               # download, auth, stripe, ai, admin
  components/
    home/              # Hero, Downloader
    dashboard/
    layout/
    ui/
  lib/                 # pinterest, auth, stripe, prisma, rate-limit
  i18n/
messages/              # en, es, fr, de, pt
prisma/
```

## Legal

Pin Down Pro is not affiliated with Pinterest. Users are responsible for respecting content owners' rights and Pinterest's Terms of Service. For personal, permitted use only.

## License

MIT
