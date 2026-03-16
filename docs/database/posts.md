# Posts Collection

**Path**: `posts/{postId}`

The `posts` collection contains all local updates shared by the community. It supports both general updates and specialized "Bus Spott" radar entries.

## Common Fields

| Field | Type | Description |
| :--- | :--- | :--- |
| `authorId` | string | The UID of the user who created the post. |
| `authorName` | string | Name of the author at the time of posting. |
| `authorPhoto` | string | Profile photo URL of the author at the time of posting. |
| `headline` | string | A short title for the update (max 100 chars). |
| `details` | string | Detailed description of the update (max 300 chars). |
| `landmark` | string | Nearest physical landmark for context (max 50 chars). |
| `category` | string | One of: `Traffic`, `Utility`, `Market`, `Services`, `Health`, `Alerts`. |
| `type` | string | either `general` or `bus_spott`. |
| `lat` | number | GPS latitude (jittered by ±20m for privacy). |
| `lng` | number | GPS longitude (jittered by ±20m for privacy). |
| `district` | string | District where the post was created. |
| `localBody` | string | Local body where the post was created. |
| `ward` | string | Ward context for the post. |
| `verifiedCount` | number | Accumulated count of the "Verified" reaction type. |
| `reactions` | map | A map tracking counts for each reaction type: `verified`, `hot`, `helpful`, `interesting`. |
| `flagCount` | number | Number of spam/abuse reports. |
| `isHidden` | boolean | Set to `true` if a post is moderated or hidden by the author. |
| `isBusinessPost` | boolean | Flags if the update is a commercial promotion. |
| `createdAt` | serverTimestamp | Timestamp of creation. |

## Specialized Fields (Bus Spott)

Only present when `type === "bus_spott"`.

| Field | Type | Description |
| :--- | :--- | :--- |
| `expiresAt` | Timestamp | Set to 20 minutes after `createdAt`. Used for the live radar feature. |
| `anchorId` | string | The ID of the nearest bus stop "Anchor" from the `anchors` collection. |
| `anchorName` | string | Human-readable name of the bus stop (e.g., "Kollam Town Stop"). |
| `timingStatus` | string | One of: `on_time`, `delayed`, `just_missed`. |
| `details` | string | In the case of bus spott, this often stores `to_city` or `to_village` directions. |
