# Journey 5: Layout & Visual Architecture

This document defines the structural "Skeleton" of NattuFeed, ensuring a consistent, "Extreme Premium" look across all pages.

## 1. The Layered Anatomy (Z-Stack)
- **Base Level**: Subtle background flares (Teal/Ivory) that move slightly on scroll.
- **Content Level**: The main feed scroll area.
- **Glass Level**: Sticky headers and floating action buttons with `backdrop-filter: blur(12px)`.
- **System Level**: Modals (Create Post, Profile) and Toast notifications.

## 2. The Global Shell
### A. The Sticky "Pulse" Header
- **Function**: Stays at the top during scroll.
- **Contents**: Ward Name, Time Filters (Live/Today/Yesterday), and Radius Selector.
- **Design**: 80% width on desktop, 95% on mobile. Rounded `2xl` corners.

### B. The Feed Grid
- **Mobile**: Single column, full width with `px-4` padding.
- **Tablet/Desktop**: Centered container (`max-w-2xl`) to maintain focus and prevent "eye-strain" stretching.

### C. The Navigation Bar (Floating Bottom)
- **Design**: A glassmorphic "Dock" (similar to iOS) appearing at the bottom.
- **Tabs**: `Home`, `Top Neighbors (Leaderboard)`, `Post (+)`, `Profile`.

## 3. Specialized Layout Primitives
### A. The BusRadarCard
- **Visuals**: Specialized instrument-style architecture within the post feed.
- **Components**: Emerald progress bar (bottom), high-contrast direction badges, and real-time distance readout.
- **Design Intent**: "Live Radar" aesthetic rather than a static post.

### B. PostCard (Standard)
- **Header**: Avatar + Name + Timeago + Lucide Icon Category Chip.
- **Body**: High-resolution image (1:1 or 4:3) with rounded `2xl` corners.
- **Footer**: Verification bar ("Me Too" count) and Action buttons.

## 4. Typography & Script Safety
- **Primary Font**: Modern Sans (DM Sans) for high legibility.
- **Malayalam Optimization**: 
  - **Leading**: `leading-tight` to handle multi-line Malayalam script without clipping.
  - **String lengths**: Shortened translations (e.g., "Post Update" ➡️ "അറിയിക്കുക") to ensure zero overflow on mobile buttons.
- **Icons**: 100% professional **Lucide React** icons (Bus, AlertTriangle, ArrowLeft, ArrowRight) integrated for a clean, industrial look.

## 5. Color Mapping
- **Traffic**: Emerald/Green (Safety & Movement).
- **Market**: Amber/Gold (Economy & Value).
- **Public Service**: Deep Blue (Accountability).
- **General**: Classic Teal (Neighborhood Pride).
