# Spools

**A social space for sharing ideas, finding your people, and building things together.**

Spools is a full-stack social app built with the MERN stack. Share short posts, explore beyond your feed, start interest-based Circles, collaborate on multi-part Spool series, and chat in real time.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [Push notifications](#push-notifications)
- [Project structure](#project-structure)
- [API overview](#api-overview)
- [Production build](#production-build)

## Features

### Profiles and connections

- Create an account, sign in, and manage your profile.
- Add a profile photo, bio, name, and username.
- Find people, view profiles, and follow or unfollow accounts.

### Spools and feeds

- Create short text posts with an optional image.
- Switch between two feeds:
  - **Following** shows posts from you and accounts you follow.
  - **Explore** discovers posts from accounts outside your following list.
- Like, reply to, repost, and save posts.
- Choose who can reply to each post: everyone, your followers, or people you mention with `@username`.

### Circles

Create or join public, interest-based communities called **Circles**. Each Circle has a name, description, member list, and its own post feed. Members can share posts with the Circle; join a Circle before posting there.

### Collaborative Spool series

Start a titled series and invite existing Spools users by username. The creator and invited collaborators can add up to 500 characters per part. Parts are numbered and displayed together in order, making a series useful for shared stories, guides, or evolving ideas.

### Real-time messaging

- Send direct messages and image messages.
- Receive new messages in real time while online.
- See read receipts: the sender's check mark turns blue after the recipient opens the conversation and the messages are marked seen.
- Message alerts respect the notification and sound preferences configured in the app.

### Installable, responsive experience

- Responsive layouts for desktop, tablet, and mobile screens.
- Light and dark themes.
- Progressive Web App support, so Spools can be installed on supported devices.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Recoil, Tailwind CSS, Chakra UI |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB with Mongoose |
| Authentication | JWT stored in an HTTP-only cookie; bcrypt password hashing |
| Media | Cloudinary |
| PWA | Vite PWA plugin and Workbox |

## Run locally

### Prerequisites

- Node.js and npm
- A MongoDB database, local or MongoDB Atlas
- A Cloudinary account for image uploads

### 1. Install dependencies

From the repository root:

```bash
npm install
npm install --prefix frontend
```

### 2. Configure environment variables

Create a `.env` file in the repository root. See [Environment variables](#environment-variables) below.

### 3. Start the backend

In one terminal, from the repository root:

```bash
npm run dev
```

The API and Socket.IO server run on port `5000` by default.

### 4. Start the frontend

In a second terminal, from the repository root:

```bash
npm run dev --prefix frontend
```

Open the Vite URL shown in the terminal (normally `http://localhost:3000`). During development, Vite proxies `/api` requests to the backend on port `5000`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign and verify login tokens |
| `CLOUDINARY_CLOUD_NAME` | For image uploads | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | For image uploads | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | For image uploads | Cloudinary API secret |
| `PORT` | No | Backend port; defaults to `5000` |
| `FRONTEND_URL` | Deployment | Frontend origin allowed by the backend CORS configuration |

Example `.env` (replace the placeholder values and keep real credentials private):

```env
MONGODB_URI=mongodb://127.0.0.1:27017/spools
JWT_SECRET=replace-with-a-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PORT=5000
FRONTEND_URL=http://localhost:3000
```

## Project structure

```text
backend/
  controllers/   Request handlers and feature logic
  models/        Mongoose models
  Routes/        Express API routes
  socket/        Socket.IO server and real-time events
  server.js      Backend entry point
frontend/
  public/        Static assets and PWA icons
  src/
    Components/  Shared interface components
    Pages/       Route-level screens
    atoms/       Recoil state
    context/     App-wide contexts
```

## API overview

Most routes below require a signed-in user. Authentication is handled with the HTTP-only `jwt` cookie.

| Feature | Routes |
| --- | --- |
| Users and profiles | `/api/users` |
| Posts and feeds | `GET /api/posts/feed?type=following\|explore`, `POST /api/posts/create`, `/api/posts/:id`, `/api/posts/reply/:id`, `/api/posts/like/:id`, `/api/posts/repost/:id`, `/api/posts/save/:id` |
| Circles | `GET/POST /api/circles`, `GET /api/circles/:id`, `PUT /api/circles/:id/join`, `PUT /api/circles/:id/leave` |
| Collaborative series | `GET/POST /api/series`, `GET /api/series/:id`, `POST /api/series/:id/parts` |
| Messages | `GET /api/messages/conversations`, `GET /api/messages/:otherUserId`, `POST /api/messages` |

Real-time messages and read receipts use Socket.IO events. A recipient's messages are marked as seen when that recipient views the conversation.

## Production build

Build the frontend from the repository root:

```bash
npm run build --prefix frontend
```

For the single-server production setup, build the frontend and start the backend with:

```bash
npm run build
npm start
```

In production mode, Express serves the built frontend from `frontend/dist` along with the API and Socket.IO server. Configure `FRONTEND_URL` for your deployed frontend origin and set the database, JWT, and Cloudinary values in the deployment environment.
# Push notifications

Spools can send web push notifications to subscribed devices, including while the PWA is closed. Push delivery requires HTTPS (localhost is allowed for development) and a VAPID key pair.

Generate a pair with `node backend/utils/generateVapidKeys.js`. Add the printed `PUSH_VAPID_PUBLIC_KEY`, `PUSH_VAPID_PRIVATE_KEY`, and `PUSH_VAPID_SUBJECT` values to the backend environment. For local development, `node backend/utils/generateVapidKeys.js --write-local` adds missing settings to the ignored root `.env` file without printing the private key. Keep the private key secret and use the same pair for all running instances of an environment.

After deployment, users can enable push for each device in **Settings → Notifications**. On iPhone and iPad, users need iOS/iPadOS 16.4 or newer and must open Spools from its Home Screen icon before granting permission. Notification sounds are controlled by the operating system; the in-app sound-effects preference controls sounds while Spools is open.
