---
timestamp: 'Thu Nov 06 2025 10:11:24 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_101124.06c57f66.md]]'
content_id: b01e8a3e20813aa9005e5e4f5159eb3a1f478218525675ea89e09221bc748e0f
---

# API Specification: Commenting Concept

**Purpose:** Allows users to add and manage comments on posts.

***

## API Endpoints

### POST /api/Commenting/addComment

**Description:** Adds a new comment to a specified post.

**Requirements:**

* The user must be authenticated (a valid `session` token is required).
* The target `post` must exist.
* The user must either be the author of the post or be friends with the author.

**Effects:**

* Creates a new comment associated with the post and authored by the user.

**Request Body:**

```json
{
  "session": "string",
  "post": "string",
  "content": "string"
}
```

**Success Response Body (Action):**

```json
{
  "comment": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Commenting/deleteComment

**Description:** Deletes a specific comment.

**Requirements:**

* The user must be authenticated (a valid `session` token is required).
* The `comment` must exist.
* The user must be the author of the comment.

**Effects:**

* Permanently deletes the specified comment.

**Request Body:**

```json
{
  "session": "string",
  "comment": "string"
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
