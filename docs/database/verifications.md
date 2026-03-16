# Verifications Collection

**Path**: `verifications/{postId_userId}`

The `verifications` collection tracks community reactions (verified, hot, etc.) to prevent duplicate karma earning and ensure community trust.

## Fields

| Field | Type | Description |
| :--- | :--- | :--- |
| `postId` | string | The ID of the post being verified. |
| `userId` | string | The UID of the user who performed the verification. |
| `type` | string | One of: `verified`, `hot`, `helpful`, `interesting`. |
| `createdAt` | Timestamp | When the verification occurred. |
| `updatedAt` | Timestamp | When the verification was last modified (switching reaction types). |
