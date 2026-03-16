# 🗺️ NattuFeed Future Roadmap: From MVP to Hyperlocal Utility

To move from your current functional MVP to a platform that generates revenue and manages large user bases, you need to build the following "Support Modules."

---

## Phase 4: Retention & Stickiness (100 - 500 Users)
*Before you make money, you must make sure people keep coming back.*

### 1. 🔔 Smart Notification Engine
- **What**: In-app and Push notifications (using Firebase Cloud Messaging).
- **Triggers**:
    - *"Your post was verified by 5 neighbors! (+1 Karma)"*
    - *"A new Bus Radar update was posted at your favorite stop."*
    - *"High-priority alert in your ward: Power cut at 2 PM."*
- **Why**: This is the single biggest driver of **Daily Active Users**.

### 2. 🏅 Automated Badge & Identity System
- **What**: Logic that grants visual badges based on Karma thresholds.
- **Badges**:
    - **"Transit Hero"**: For users with 50+ Bus Spott points.
    - **"Community Guard"**: For users with 100+ verifications.
- **Why**: Increases the "Prestige" of the app, making users more loyal and protective of their account.

---

## Phase 5: Operations & Moderation (500 - 1,000 Users)
*You can't manage 1,000 users with just your phone; you need tools.*

### 3. 🛡️ Admin/Moderator Command Center
- **What**: A hidden private route (`/admin`) for you and your trusted moderators.
- **Features**:
    - **Flag Queue**: Review posts that hit the 5-flag limit and decide to "Delete" or "Restore."
    - **Anchor Manager**: Add new bus stops or edit location of existing ones directly in the UI.
    - **Karma Adjustment**: Ability to manually reward users for exceptional community service.
- **Why**: Keeps the neighborhood "clean" and free from spam/political noise.

---

## Phase 6: Revenue Foundation (1,000+ Users)
*Changing the app from a community tool to a business ecosystem.*

### 4. 🏪 Business/Service Onboarding Module
- **What**: A specialized profile setup for non-individuals.
- **Fields**: Shop location, WhatsApp contact, Business Category, and Operating Hours.
- **The "Nattu-Verified" Badge**: A way for local plumbers/electricians to pay a small "Trust Fee" to have their identity verified by the admin.
- **Why**: This is your primary **Revenue Stream**.

### 5. 📍 Sponsored Landmark Integration
- **What**: Allowing a business to "Sponsor" a specific `bus_anchor`.
- **UI Change**: Instead of just showing "Civil Station Stop," the map/card shows "Civil Station Stop (Sponsored by XYZ Cafe)."
- **Why**: High-value, non-intrusive local advertising.

---

## Summary of Technical Tasks
1.  **Firebase Cloud Messaging (FCM)** setup for notifications.
2.  **Firestore Admin SDK** logic for a separate Moderator UI.
3.  **Role-Based Access Control (RBAC)**: Distinguishing between `admin`, `business`, and `citizen` user types.

*Ready to build any of these? Or should we focus on more polish for the current MVP?*
