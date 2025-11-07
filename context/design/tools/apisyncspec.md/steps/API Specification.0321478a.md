---
timestamp: 'Thu Nov 06 2025 10:11:24 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_101124.06c57f66.md]]'
content_id: 0321478aad5025c582e0faaf895ff0a8b3cf7737b196e91ed7559b38f6fef879
---

# API Specification: Friending Concept

**Purpose:** Manages friend relationships and requests between users.

***

## API Endpoints

### POST /api/Friending/sendRequest

**Description:** Sends a friend request from the authenticated user to another user.

**Requirements:**

* The sender must be authenticated (a valid `session` token is required).
* The recipient user specified by `toUsername` must exist.
* The sender cannot send a friend request to themselves.
* The two users must not already be friends.

**Effects:**

* Creates a new friend request from the sender to the recipient.

**Request Body:**

```json
{
  "session": "string",
  "toUsername": "string"
}
```

**Success Response Body (Action):**

```json
{
  "friendRequest": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
