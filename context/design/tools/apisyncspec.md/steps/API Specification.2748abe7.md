---
timestamp: 'Thu Nov 06 2025 10:11:24 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_101124.06c57f66.md]]'
content_id: 2748abe72f557aac7ad6a8e2b8d8758aeab941e71b26b3848afc2d34ad0f7d4c
---

# API Specification: Posting Concept

**Purpose:** Enables users to create and manage posts.

***

## API Endpoints

### POST /api/Posting/create

**Description:** Creates a new post for the authenticated user.

**Requirements:**

* The user must be authenticated (a valid `session` token is required).

**Effects:**

* Creates a new post with the provided content, authored by the authenticated user.

**Request Body:**

```json
{
  "session": "string",
  "content": "string"
}
```

**Success Response Body (Action):**

```json
{
  "post": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Posting/delete

**Description:** Deletes a specific post.

**Requirements:**

* The user must be authenticated (a valid `session` token is required).
* The `post` must exist.
* The user must be the author of the post.

**Effects:**

* Permanently deletes the specified post and triggers the deletion of all its associated comments.

**Request Body:**

```json
{
  "session": "string",
  "post": "string"
}
```

**Success Response Body (Action):**

```json
{
  "status": "success"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
