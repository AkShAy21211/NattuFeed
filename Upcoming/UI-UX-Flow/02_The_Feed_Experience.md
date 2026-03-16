# Journey 2: The Daily Pulse Discovery

This flow covers how a user navigates and interacts with the feed every morning.

### 1. The Sticky Header (Navigation)
- **Top Row**: Location name + Total Posts count.
- **Center Row (New)**: **Smart Time Filters** (🔴 Live | ✨ Today | 🕰️ Yesterday).
- **Control Row**: **The Radius Selector** (2km, 5km, 10km) tucked next to the time pills.

### 2. Category Flicking
- **User Action**: Taps on category icons (Traffic, Market, Utility, Services, etc.).
- **UI Response**: The feed filters to show selected updates.
- **Specialized Rendering**: For `Traffic`, the feed renders an instrument-style **BusRadarCard** instead of a text post.
- **Color Coding**: 
  - **Traffic**: Emerald/Green (Safety & Transit).
  - **Market**: Amber/Gold (Price Intel).

### 3. Reading a Post
- **Visuals**: Glassmorphic cards with category-coded accents.
- **Instrument Elements**: Bus Radar cards include high-contrast direction badges and shrinking progress bars.
- **Micro-interactions**: Expanding a card reveals the "Me Too" verification count.

### 4. The "Me Too" Confirmation (Trust Verification)
- **User Intent**: Confirming a bus location or a market price.
- **Gated Action**: For **Bus Spott**, the verification tick is only active if the user is within **500m** of the reported coordinates (verified via `useLocation`).
- **Feedback**: A "Karma +1" pulse animation; the verified count turns primary color.
