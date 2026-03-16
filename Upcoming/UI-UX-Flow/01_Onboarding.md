# Journey 1: The First Neighbor Entrance

This flow covers the user's journey from landing on the URL to seeing their neighborhood's pulse for the first time.

### 1. The Glassmorphic Landing
- **User Action**: Opens `nattufeed.app`.
- **UI State**: A premium "Extreme Premium" landing page with a blurred ivory/teal background.
- **Privacy & Transparency**: **Privacy Policy** and **Terms of Service** links are available publicly at the bottom, bypass-auth.
- **Button**: `Start Catching Up`.

### 2. The Permission Handshake
- **System Action**: Browser requests Location access.
- **UI UX**: A modal explains that NattuFeed is a hyperlocal 2km-radius app. 
- **User Action**: Grants permission.

### 3. The Quick Setup
- **User Action**: Enters **Name**.
- **Location Pinning**: Selects **District**, **Local Body**, and **Ward Number** from structured dropdowns to ensure community accuracy.
- **Language**: User selects **Malayalam** or **English**. (UI optimized for Malayalam script safety).
- **Result**: Firebase Auth initializes the profile.

### 4. Direct Entry (The Feed)
- **UI State**: The app instantly calculates the user's ward and displays the **Live Pulse**.
- **Welcome**: A subtle "Welcome to [Azhikode] Ward" toast notification.
