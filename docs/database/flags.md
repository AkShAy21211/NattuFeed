# Flags Collection

**Path**: `flags/{docId}`

The `flags` collection stores community moderation reports. When a user flags a post for being inappropriate, spam, or inaccurate, a document is created here to track the report and prevent duplicate flagging.

## Fields

| Field | Type | Description |
| :--- | :--- | :--- |
| `postId` | string | The ID of the post being flagged. |
| `userId` | string | The UID of the user who performed the flagging. |
| `reason` | string | (Optional) The category of the report (e.g., "Spam", "False Info"). |
| `createdAt` | Timestamp | When the flag was submitted. |

## Community Moderation Logic
- The system listens to updates on the `posts` collection.
- When `flagCount` for a post reaches a threshold (typically **5 flags**), the post is automatically hidden (`isHidden = true`) from the community feed pending review.
