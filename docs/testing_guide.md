# NattuFeed Testing Manual 🧪

This guide explains how to effectively test NattuFeed using the newly integrated testing suite. Testing is divided into four main layers, ranging from basic UI checks to high-concurrency stress tests.

---

## 1. Local Environment Setup (Emulator)

The **Firebase Emulator** is your sandbox. It mimics your production database, auth, and storage without any cost or risk of data corruption.

### How to Start
1. **Stop** your regular `npm run dev`.
2. Run: `firebase emulators:start`
3. Access the **Emulator UI**: [http://localhost:4000](http://localhost:4000)
4. Access the **App**: [http://localhost:5000](http://localhost:5000)

---

## 2. What to Test: Functional Scenarios

When the app is running in the emulator, perform these manual checks to ensure the "Vibe" and logic are correct:

### A. Onboarding & Profile
- **Fresh Login**: Use any phone number (e.g., +1 650 555 1234) and any 6-digit code.
- **Quick Setup**: Choose a district and ward. Verify the "Emerald" theme consistency.
- **Edit Profile**: Change your name and location. Verify the title says "Edit Profile" and not "Update Location".

### B. Posting & Categories
- **General Update**: Create a "Utility" or "Services" post. Verify it appears on the feed with the correct icon.
- **Bus Spott (Virtual Radar)**: Create a "Traffic" post in "Bus Radar" mode.
    - Select a direction.
    - Verify it appears as a specialized `BusRadarCard`.
    - Observe the 20-minute countdown bar at the bottom.

### C. Community Trust (Me Too)
- **Verification**: Locate a post (other than your own). Click "Me Too".
- **Karma Polish**: Watch for the floating "+2 Karma" animation.
- **Range Check**: Try to verify a post far away (GPS-wise). Verify it prevents you and shows a toast warning.

---

## 3. Concurrency Stress Testing (Transactions)

The most critical logic is the **Verification Transaction**. We must ensure that 100 people clicking "Me Too" simultaneously doesn't create 101 karma points or crash the DB.

### How to Run
```bash
npm run test:stress
```

### What to check:
- It will automatically create a post in the emulator.
- It will simulate 100 simultaneous writes.
- **Success Criteria**: The final `verifiedCount` in the console must be **exactly 100**.

---

## 4. Load Testing (Traffic Simulation)

This tests how the Server and the PWA handle multiple users hitting the site at once.

### How to Run
```bash
artillery run load-test.yml
```

### What it does:
- **Phase 1 (Warm up)**: 5 new users/sec for 60s.
- **Phase 2 (Ramp up)**: 20 new users/sec for 120s.
- **Phase 3 (Peak)**: 50 new users/sec for 60s.

### What to check:
- Look for `http.codes.200` in the report.
- Verify `http.request_rate` remains steady without erroring out.

---

## 5. Performance & Mobile Experience

Since NattuFeed is for Kerala users, often on mid-range Android devices with varying 3G/4G coverage:

1. **Throttled Test**: Open Chrome DevTools > Network tab. Change "No Throttling" to **"Fast 3G"** or **"Slow 3G"**.
2. **Refresh**: Observe how the "Glassmorphism" loads. Is the text readable before images appear?
3. **PWA Check**: Verify the "Install App" prompt appears and the app can be added to your home screen.

---

## 6. Understanding Cloud Performance (Cold Starts)

Since NattuFeed uses **Cloud Functions** for Server-Side Rendering (SSR):

*   **What is a Cold Start?**: If the app hasn't been used for a while (e.g., 15+ minutes), Google "puts the server to sleep" to save you money. The next person who visits will experience a **1-3 second delay** while the server "wakes up."
*   **Why does this happen?**: This is the trade-off for the **Free Tier**. You don't pay for the server when no one is using it.
*   **In Production**: Once the app has steady traffic, the "Cold Start" almost never happens because the server stays "warm" from constant use.

---

## Summary Checklist for Deployment 🚀
- [ ] Emulators start without errors.
- [ ] `npm run test:stress` returns 100% success.
- [ ] Profile editing works in both Malayalam and English.
- [ ] Bus Radar cards auto-decay correctly.
- [ ] Cold Start behavior is understood and accepted for launch.
