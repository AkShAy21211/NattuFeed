# 🏗️ NattuFeed: Technical Architecture & Infrastructure

This document outlines the engineering heart of NattuFeed, detailing the tech stack, security protocols, and architectural decisions that drive the platform.

## 🛠️ Technology Stack

### Core Framework
- **[Next.js 15+](https://nextjs.org/)**: Utilizing App Router with Turbopack for ultra-fast HMR and optimized server-side rendering where applicable.
- **React 19**: Leveraging the latest concurrent features and hooks for fluid state management.

### Styling & UI
- **Vanilla CSS**: A custom-engineered design system focusing on **Glassmorphism**.
- **Tailwind-like Utilities**: Standardized classes for layout consistency without the bloating of external libraries.
- **[Lucide React](https://lucide.dev/)**: For lightweight, consistent iconography.
- **DM Sans**: Our primary typeface, selected for readability across English and Malayalam.

### Backend Orchestration (Firebase)
- **Firestore (NoSQL)**: Real-time synchronization for feeds, leaderboards, and profile updates.
- **Firebase Auth**: Secure Google Sign-In and OTP-based mobile authentication.
- **Firebase Functions (V2)**:
  - `resetWeeklyKarma`: A scheduled task (running Asia/Kolkata timezone) that resets the weekly leaderboard every Monday at 00:00.
- **Firebase Hosting**: High-speed global CDN for the front-end application.
- **Firebase Analytics & Google Analytics 4**: PII-free behavioral tracking.
- **Microsoft Clarity**: Visual interaction analysis (heatmaps and session recordings) for UX optimization.

---

## 🔐 Security & Privacy Architecture

### Coordinate Jittering Algorithm
To protect the exact home locations of users, NattuFeed implements a client-side "digital fog":
- Whenever a post is created, the system generates a random offset between **±0.0001 and ±0.0002 decimal degrees**.
- This translates to approximately **10–20 meters** of location obfuscation.
- The jitter is applied *before* data reaches Firestore, ensuring that even in the database, the user's exact pinpoint is never stored.

### Firestore Rules Hardening
- **Profile Protection**: Users cannot modify sensitive fields (like karma) directly unless the diff contains only allowed incremental updates.
- **Post Ownership**: `isHidden` and `delete` operations are strictly gated by `request.auth.uid == authorId` or specialized Admin UID checks.
- **Public Snippets**: The system is designed to allow neighbors to see name/photo/karma/district but restricts access to private neighborhood configuration data.

### Storage Namespacing
- All user-uploaded content is stored in `/post_images/{userId}/{fileName}`.
- Storage rules strictly enforce that a user can only write to their own namespace.

---

## 📈 Database & Indexing Strategy

### Compound Indexes
Optimized for high-performance reading of hyperlocal data:
- `isHidden ASC, category ASC, createdAt DESC`: For category-specific feed filtering.
- `district ASC, karmaWeekly DESC, karmaTotal DESC, createdAt ASC`: Driving the dual-sort Leaderboard logic.
- `authorId ASC, createdAt DESC`: Powering the "My Updates" view on profile pages.

### Performance Optimization
- **Client-Side Heavy**: Distance calculations (Haversine formula) and time-decay logic are performed on the user's device. This allows for instant UI feedback (e.g., radius switching) without incurring server costs or latency.

---

## 📦 Project Structure

```text
├── src/
│   ├── app/                # Next.js App Router (Pages & Layouts)
│   ├── components/         # Modular UI (PostCard, RadarCard, etc.)
│   ├── context/            # Auth, Language, and Global State providers
│   ├── hooks/              # Custom Geo-location and UI hooks
│   ├── lib/                # Shared utilities (Firebase, Moderation, Algo)
│   └── types/              # Unified TypeScript interfaces
├── functions/              # Firebase Cloud Functions (Typescript)
├── public/                 # Static assets & PWA Manifest/Icons
├── firestore.rules         # Hardened DB Security
└── storage.rules           # Hardened Media Security
```

---
*NattuFeed Architecture: Engineered for local resilience and global-scale privacy.*
