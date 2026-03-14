# NattuFeed - Local Community Updates Hub

NattuFeed is a minimal, hyper-local community progressive web application (PWA) designed to foster real-time neighborhood updates. The platform focuses on providing high-utility local information—like traffic alerts, market prices, and public service announcements—wrapped in a highly polished, glassmorphism-inspired UI.

![NattuFeed Logo](public/logo.png)

## Core Features
- **Real-time Local Feed**: View anonymous and authenticated posts tailored to your community.
- **Micro-Categorization**: Updates are explicitly categorized into high-value buckets: Traffic, Public Service, Fish/Market, and General.
- **"Me Too" Verification System**: Instead of traditional likes, users boost post credibility through a community verification system.
- **Spam Control**: Integrated reporting and flagging mechanism with auto-hide logic for community moderation.
- **Gamified Karma**: Users earn "Karma" points for posting and verifying accurate information.
- **PWA Ready**: Installable as a progressive web application on mobile devices for native-like access.
- **Bilingual Interface**: Seamlessly switch between English and Malayalam.
- **Supreme Admin Control**: Specific users have elevated privileges to moderate and delete community posts.

## User Experience & Design
NattuFeed's architecture heavily emphasizes an **"Extreme Premium"** mobile-first user experience.
- Heavy use of CSS backdrop filters and glassmorphism.
- Micro-interactions (hover states, loaders, karma popups).
- Curated color palette mapped to categories allowing rapid visual parsing of the feed.

## Technology Stack
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom glassmorphic utilities and animations
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **Deployment**: [Firebase Hosting](https://firebase.google.com/docs/hosting) & Firebase Functions
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app`: Next.js App Router routing logic and primary pages.
- `/src/components`: UI components including the highly polished `PostCard` and `KarmaNotification`.
- `/src/context`: React Context providers for global state (AuthContext, LanguageContext, GamificationContext).
- `/src/lib`: Utility functions and Firebase initialization.

## Firebase Deployment

This project is fully integrated with Google Firebase and requires a configured `firebase.json` and `.firebaserc` file. 

To deploy:
```bash
npm run build
firebase deploy
```
