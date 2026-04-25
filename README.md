# Tregu — Albania's Marketplace

A full-stack marketplace platform for Albanian local businesses. Built with React + Vite (frontend) and Node.js + Express (backend).

## Stack
- **Frontend**: React 18, Vite, React Router v6, CSS Modules
- **Backend**: Node.js, Express
- **Deploy**: Vercel

## Project structure
```
albania-marketplace/
├── client/          ← React app (Vite)
│   └── src/
│       ├── pages/       ← All screens
│       ├── components/  ← Reusable UI
│       ├── context/     ← CartContext (global state)
│       └── data/        ← Mock data
├── server/          ← Express API
│   ├── index.js     ← All routes
│   └── data/        ← Mock data (replace with DB later)
└── vercel.json      ← Deploy config
```

## Local development

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Start both frontend and backend
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Deploy to Vercel

### Option A: Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option B: Vercel dashboard
1. Push this project to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repo
4. Set **Root directory** to `.` (root)
5. Set **Build command** to `npm run build`
6. Set **Output directory** to `client/dist`
7. Deploy

## API endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/products | List products (supports ?q, ?category, ?city, ?sort) |
| GET | /api/products/:id | Get single product |
| GET | /api/shops | List shops |
| GET | /api/shops/:id | Get single shop |
| POST | /api/orders | Place an order |
| POST | /api/products | Add a product (seller) |

## Next steps (Phase 2)
- [ ] Connect a real database (Supabase recommended)
- [ ] Add authentication (Supabase Auth)
- [ ] Add image uploads (Supabase Storage or Cloudinary)
- [ ] Integrate a payment provider
- [ ] Add real delivery tracking

## App name
**Tregu** = "market" in Albanian 🇦🇱
