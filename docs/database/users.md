# Users Collection

**Path**: `users/{userId}`

The `users` collection stores detailed profile information for each registered user. The `userId` matches the Firebase Authentication UID.

## Fields

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | string | Full name of the user. |
| `photoURL` | string | URL of the user's profile picture. |
| `karmaTotal` | number | Accumulated karma points over the lifetime of the account. |
| `karmaWeekly` | number | Karma points earned in the current week (for leaderboard ranking). |
| `district` | string | The user's selected primary district in Kerala. |
| `localBody` | string | The user's selected Panchayat, Municipality, or Corporation. |
| `village` | string | (Optional) Specific village within the local body. |
| `ward` | string | (Optional) Ward number or specific area name. |
| `state` | string | Defaults to "Kerala". |
| `onboarded` | boolean | Set to `true` once the user completes the initial profile setup. |
| `ageGroup` | string | (Optional) One of: `youth`, `youngAdult`, `middleAge`, `senior`. |
| `identityBonusReceived` | boolean | (Optional) Track if the user has received the one-time registration bonus. |
| `createdAt` | serverTimestamp | Timestamp when the user profile was first created. |
