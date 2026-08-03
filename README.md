# 🌐 Mitra — Production-Grade Social Networking Platform

Mitra is a full-stack social networking platform built on the MERN stack, engineered with production concerns in mind from the ground up: secure resource-level authorization, real-time communication over both SSE and WebRTC, a themeable design system, and a security posture hardened against common web vulnerabilities (XSS, IDOR) rather than assumed away.

The project is designed to demonstrate production-level backend engineering, clean software architecture, secure API design, and scalable, maintainable frontend development.

---

## Overview

Mitra adopts a modular architecture that separates presentation, business logic, and infrastructure concerns. The system combines event-driven background processing with two distinct real-time transports — Server-Sent Events for messaging/presence and WebRTC for voice/video calls — to deliver a responsive, interactive user experience without over-engineering a single transport to do everything.

---

## Core Capabilities

### Social Graph
- User onboarding and profile management
- Follow / Unfollow and mutual-connection request flows
- Personalized, paginated feed generation
- Post creation, editing, and deletion, with multi-image support
- Post privacy controls — public, followers-only, or private, enforced consistently across feed, profile, hashtag, and search surfaces via a single shared authorization utility
- Like and threaded-comment system (comments and replies)
- Bookmarks / saved posts
- Hashtag extraction, trending topics, and hashtag-scoped feeds
- 24-hour ephemeral Stories (text, image, and video)
- Server-side feed pagination

### Real-Time Messaging
- Instant 1:1 and group messaging over Server-Sent Events
- Group chat with multi-admin permissions, membership management, and automatic admin succession if the last admin leaves
- Message actions: reply/quote, edit (10-minute window), delete for me, delete for everyone (1-hour window), and multi-recipient forwarding
- Typing indicators and delivery/seen receipts
- Live presence (online/offline) broadcast to connections

### Voice & Video Calling
- Peer-to-peer voice and video calls over WebRTC, with STUN/TURN fallback for NAT traversal
- Call signaling multiplexed over the existing SSE connection — no separate signaling server
- Call history persisted as message-thread entries (missed, declined, completed, with duration)

### Identity & Access Management
- Clerk-based authentication with webhook-driven user synchronization
- Secure, stateless session handling
- Resource-level authorization on every protected endpoint — not just "is this user logged in" but "is this user allowed to see or act on this specific resource"
- Authentication-aware SSE connections (token-verified at stream open, since the browser's native EventSource API can't send custom headers)

### Event-Driven Processing
- Background workflows powered by Inngest
- Asynchronous email notifications (connection requests, reminders, unseen-message digests)
- Scheduled story expiry
- Workflow retries and failure handling, decoupled from the request/response cycle

### UI/UX & Design System
- Full light / dark / system theming, built on a CSS custom-property token architecture (not hardcoded colors duplicated per component)
- Command palette (⌘K) for quick navigation across people and hashtags, with full keyboard support
- Responsive, mobile-first layout with a dedicated bottom navigation bar and drawer sidebar on small screens
- Motion and micro-interactions via Framer Motion (animated navigation state, hover/entrance transitions), applied selectively rather than uniformly

---

## Security Engineering

Security was treated as an ongoing audit process, not a one-time checklist:

- **XSS prevention** — post/comment content is rendered through safe React text interpolation rather than `dangerouslySetInnerHTML`, closing a stored-XSS vector in user-generated content
- **IDOR fixes** — several endpoints were found and corrected to properly scope resource access to the requesting user (notification read-status, message deletion, profile visibility)
- **Real HTTP status codes** — every endpoint returns accurate status codes (401/403/404/409/429/500) instead of always-200 responses, backed by a frontend interceptor so error handling stayed consistent through the change
- **Rate limiting** on the API layer via `express-rate-limit`
- **Consistent resource-level checks** — a single shared `canViewPost` utility enforces post visibility everywhere posts are read or acted on, rather than reimplementing the check per endpoint

---

## Performance Engineering

- N+1 query elimination — batched queries replace per-item database round-trips (e.g. "People You May Know" suggestions)
- Atomic MongoDB update operations (`$addToSet`, `$pull`, `updateOne`) instead of read-modify-write races
- Object storage upload pipeline via ImageKit with on-the-fly image transformation (resize, format, quality) instead of serving originals
- Server-side pagination on feed and message endpoints
- Reduced unnecessary re-renders through targeted Redux slice design

---

## Technology Stack

**Frontend**
- React (Vite)
- React Router
- Redux Toolkit
- Tailwind CSS v4, with a custom design-token system
- Framer Motion
- Axios

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB
- Mongoose ODM

**Authentication**
- Clerk Authentication & Webhooks

**Real-Time Communication**
- Server-Sent Events (SSE) — messaging, presence, typing, call signaling
- WebRTC — peer-to-peer voice/video calls

**Media Storage**
- ImageKit — upload, CDN delivery, and on-the-fly transformation

**Workflow Orchestration**
- Inngest

**Development & Tooling**
- Git, GitHub, Postman
- Docker & Docker Compose

---

## Architecture

Mitra follows a layered architecture that promotes loose coupling, separation of concerns, and long-term maintainability.

### Frontend

```
client/
└── src/
    ├── api/            axios instance + interceptors
    ├── assets/          static assets, icon/nav data
    ├── components/       reusable UI components
    ├── context/          React context providers (theme, calls)
    ├── pages/            route-level views
    └── store/
        └── slices/       Redux Toolkit slices (flat, one per domain)
```

**Responsibilities**
- Component-driven UI architecture
- Centralized API abstraction with response-status normalization
- Global state management via Redux Toolkit
- Shared design-token system for consistent theming across every component

### Backend

```
server/
├── configs/          third-party service configuration (DB, ImageKit, mailer, multer)
├── controllers/       business logic per resource
├── inngest/           background workflow functions
├── middlewares/        auth and request-pipeline middleware
├── models/            Mongoose schemas
├── routes/            REST endpoint definitions
└── utils/             shared logic (authorization checks, connection checks)
```

**Responsibilities**
- RESTful API layer
- Business logic isolation per controller
- Authentication and authorization middleware
- Event publishing to background workflows
- Shared utilities to avoid duplicating security-relevant logic across controllers

---

## Running with Docker

The project ships with a `Dockerfile` per service and a root-level `docker-compose.yml` that orchestrates the frontend, backend, and a local MongoDB instance.

**1. Copy the environment templates and fill in real values:**
```bash
cp server/.env.example server/.env
cp .env.example .env
```
`server/.env` holds backend secrets (Clerk, ImageKit, SMTP). The root `.env` holds the frontend's `VITE_*` variables — these are baked into the static build at *build time*, not read at container runtime, since that's how Vite works.

**2. Start everything:**
```bash
docker compose up --build
```
This runs MongoDB, the Express API, and the built frontend (served via nginx) together. Frontend: `http://localhost:5173`. Backend: `http://localhost:4000`.

**A note on `VITE_BASE_URL`:** it must point to wherever your *browser* can reach the backend (e.g. `http://localhost:4000`), not the internal Docker service name — the frontend JS runs in the user's browser, outside the Docker network, so `http://server:4000` would not resolve there.

**Using a remote database instead of the bundled MongoDB container:** the `server` service's `MONGODB_URL` is set in `docker-compose.yml` to point at the local `mongo` container by default. To use a hosted cluster (e.g. MongoDB Atlas) instead, remove that override from `docker-compose.yml` and set `MONGODB_URL` in `server/.env` instead — `environment` values in Compose take precedence over `env_file`, so the override has to be removed for `server/.env`'s value to take effect.



- Modular full-stack architecture with clear separation between transport, business logic, and data layers
- Two purpose-fit real-time transports (SSE for messaging, WebRTC for calls) rather than forcing one transport to do both
- Security treated as continuous — specific, named vulnerability classes found and fixed, not just "auth is required"
- A single shared authorization utility (`canViewPost`) enforced consistently across every surface that reads or mutates posts, rather than ad hoc checks per route
- CSS custom-property design-token architecture — theme changes propagate from one source of truth instead of per-component overrides
- Stateless backend services with resource-scoped authorization on every protected endpoint

---

## Scalability Considerations

The current architecture runs as a single Node.js process with in-memory SSE connection tracking — appropriate at current scale, with a clear upgrade path already identified:

- Redis-backed pub/sub for SSE, to support horizontal scaling beyond a single instance
- Kubernetes orchestration
- CI/CD via GitHub Actions
- Search indexing for full-text post/hashtag search
- Push notification service
- Observability (structured logging, metrics, tracing)
- CDN-backed media delivery (partially addressed today via ImageKit's own CDN)
- SFU-based group calling for larger call sizes (current WebRTC implementation is peer-to-peer mesh, practically capped around 4 participants by design)

---

## Design Principles

- Separation of Concerns
- Modular Architecture
- Event-Driven Design where appropriate, direct request/response where simpler
- Secure-by-default APIs — deny by default, explicitly grant access
- Reusable components and shared utilities over duplicated logic
- Honest scope — features are either fully implemented or clearly marked as future work, never partially faked