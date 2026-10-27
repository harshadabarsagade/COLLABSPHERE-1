# CollabSphere – AI-Powered Developer Collaboration Platform

A mini GitHub + Notion for developers, supercharged with Google Gemini.

## Features
- JWT authentication with bcrypt password hashing
- Projects with owner/member collaboration and a dashboard
- Markdown notes with live preview + Gemini "Explain" and "Suggest improvements"
- File upload (Multer, local `uploads/`) with image/text preview + Gemini "Explain this code" / "Generate docs"
- Contribution analytics (notes and files per member)
- Public read-only shareable project page (`/p/:publicId`)
- Gemini endpoints: `/api/gemini/explain`, `/api/gemini/docs`, `/api/gemini/readme`

## Tech stack
React (Vite), Node.js, Express, MongoDB + Mongoose, bcryptjs, jsonwebtoken, Multer, Google Gemini API

## Setup

1. **Environment** – copy `.env.example` to `server/.env` and fill in values (MongoDB URI, JWT secret, Gemini API key from https://aistudio.google.com/apikey).
2. **Backend**
   ```bash
   cd server
   npm install
   npm run dev
   ```
3. **Frontend** (new terminal)
   ```bash
   cd client
   npm install
   npm run dev
   ```
4. Open http://localhost:5173

The Vite dev server proxies `/api` to `http://localhost:5000`.

## API overview
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Auth |
| GET/POST | `/api/projects` | List / create projects |
| GET/PUT/DELETE | `/api/projects/:id` | Project details |
| POST/DELETE | `/api/projects/:id/members` | Add / remove member |
| GET | `/api/projects/:id/analytics` | Contribution stats |
| POST | `/api/projects/:id/share` | Toggle public page |
| GET | `/api/projects/public/:publicId` | Public read-only project |
| CRUD | `/api/projects/:id/notes` | Notes |
| CRUD | `/api/projects/:id/files` | File upload / list / preview / delete |
| POST | `/api/gemini/explain`, `/docs`, `/readme` | AI features |

## Deployment
- Database: MongoDB Atlas
- Backend: Render / Railway / Google Cloud Run (set env vars; note local `uploads/` is ephemeral on most hosts, so switch to Cloudinary for production)
- Frontend: Vercel / Netlify (set the API base URL or a rewrite to the backend)

## Security notes
- Never commit `.env`
- Uploads limited to 5MB, executable extensions blocked, files served only to project members
- Markdown output is sanitized with DOMPurify
