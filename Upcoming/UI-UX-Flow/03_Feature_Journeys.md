# Journey 3: The "Magic" Feature Loops

Detailed flows for the three core Optimal MVP features.

## A. The Bus Spott Journey (Transit)
1. **The Problem**: Private buses in Kerala lack official tracking.
2. **The Fix**: "Virtual Radar." A human-powered, 2-tap reporting system.
3. **The Reporter UX**:
   - Opens "Post" -> Selects `Traffic`.
   - **Dual-Mode Toggle**: Chooses between `Bus Radar` (default) or `Other Issues` (accidents, blocks).
   - **Icon-Driven Flow**: Taps clean Lucide-icon buttons: `ArrowLeft` (**To City**) or `ArrowRight` (**To Village**).
   - **Community Route Input**: Enters the route (e.g., "Kannur-Azhikode"). Suggested local examples help standardization.
   - **Silent GPS Snap**: The moment the direction is tapped, the app captures precise coordinates.
4. **The Viewer experience**:
   - Neighbor at the stop opens the feed.
   - Sees a specialized **BusRadarCard** (Emerald theme).
   - **Real-Time Distance**: Displays *"500m away"* using the Haversine formula.
   - **Decay Timer**: A shrinking emerald progress bar indicates freshness (auto-expires in 20 mins).
5. **The Verification Loop**:
   - Neighbor on the bus taps **Verified** (Me Too).
   - **Proximity Gating**: The button only unlocks if they are within 500m of the bus location, preventing "remote fake verifications."

## B. The Market Ticker Journey (Economy)
1. **User at harbor**: Posts "Mathi is ₹180" -> Enters `180` in the price field.
2. **Community Loop**: 3 other neighbors post their prices.
3. **The UX**: The app clusters these and displays a **Top Bar**: *"Mathi Avg: ₹193"*.
4. **Shopper View**: A mother sees the avg. price and effectively bargains with her local vendor.

## C. The Grievance Audit Journey (Accountability)
1. **Reporting**: User uploads a photo of a road hazard -> Marked as `[Pending]`.
2. **Validation**: Neighborhood verifies it via "Me Too."
3. **Resolution**: The Admin/Ward Member fixes it -> Toggles status to `[Resolved]`.
4. **Reward**: The card turns Green, and the original reporter gets a "Resolved" badge on their profile.
