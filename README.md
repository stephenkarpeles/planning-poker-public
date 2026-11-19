# Planning Poker

Dark, simple story-point voting for sprint planning and grooming.

**Points:** 1 · 2 · 3 · 5 · 8 · 13

## How it works

1. Organizer enters their name and starts a session.
2. Copy the shareable link and send it to the team.
3. Everyone joins with a name and picks a point value.
4. Organizer clicks **Reveal** when ready.
5. Organizer starts a **New task** (named or blank) to clear votes and go again.

Sessions stay available as long as your database retains them. Organizer controls stay on the browser that created the session.

## Local development

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3451](http://127.0.0.1:3451).

Without `DATABASE_URL`, sessions live in memory on the dev server (fine for local testing).

## Deploy on Vercel

1. Push this repo and import it in Vercel.
2. Add a Postgres database (Neon via the Vercel marketplace is the easiest path).
3. Set `DATABASE_URL` on the project.
4. Deploy.

The app creates its table automatically on first use.

## Stack

Next.js · TypeScript · Tailwind · shadcn/ui
