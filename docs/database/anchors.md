# Anchors Collection

**Path**: `bus_anchors/{anchorId}`

The `anchors` collection stores the physical infrastructure for the **Bus Radar** system. These are verified bus stops and significant transit junctions where users can report bus timings.

## Fields

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | string | Human-readable name of the bus stop (e.g., "Civil Station Stop"). |
| `location` | geopoint | Optional GeoPoint containing `latitude` and `longitude`. |
| `lat` | number | GPS latitude (legacy/fallback field). |
| `lng` | number | GPS longitude (legacy/fallback field). |
| `routes` | array<string> | List of bus route numbers/names passing through this stop. |
| `radius` | number | The geofence radius in meters (typically 500) for unlocking timing features. |
| `district` | string | District context for filtering. |
| `verified` | boolean | Set to `true` if this is a system-approved stop. `false` if suggested by a user. |
| `suggestedBy` | string | (Optional) UID of the user who suggested the stop. |
| `createdAt` | serverTimestamp | When the anchor was added to the system. |

## Usage
When a user attempts to post in the `Traffic` ➔ `Bus` category, the system queries this collection to find the nearest anchor. If within the `radius`, the post is linked via `anchorId`.
