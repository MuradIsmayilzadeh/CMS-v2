# CMS v2 — Contest Management System

A system for running programming contests. Participants log in to a contest, read the problems and upload C++ solutions before the timer runs out. Admins create contests, add problems and participants, and review submissions.

- **Frontend:** Next.js 13 (App Router), in `/app`
- **Backend:** Express + JWT, in `/backend`. It uses MongoDB when `MONGODB_URI` is set, and otherwise a local `data.json` file seeded with demo data.

## Getting started
```bash
# API
cd backend
npm install
cp .env.example .env   # optional
npm start              # http://localhost:8000

# Web app (in another terminal, from the project root)
npm install
npm run dev            # http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` if the API runs somewhere other than `http://localhost:8000`.

### Demo accounts (local JSON store only)
- Admin: `admin` / `admin123`
- Participant in "Weekly Warm-up #1": `student` / `student123`
