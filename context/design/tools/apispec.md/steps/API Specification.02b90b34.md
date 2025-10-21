---
timestamp: 'Mon Oct 20 2025 23:24:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_232416.2ad8532b.md]]'
content_id: 02b90b3439e4c2d7cbefe1202e74b002c68545ce8369ec6f5f1c3bbb3994094d
---

# API Specification: Commenting Concept

**Purpose:** enable discussion around shared posts

***

## API Endpoints

### POST /api/Commenting/addComment

**Description:** Creates a new comment authored by a user under a specific post.

**Requirements:**

* author and post must exist (implicitly handled by syncs providing valid IDs)
* author must have visibility of the post (implicitly handled by syncs)
* content cannot be empty

**Effects:**

* creates a comment authored by the user under the post with the text content

**Request Body:**

```json
{
  "author": "string",
  "content": "string",
  "post": "string"
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

**Description:** Deletes a comment if the requesting user is its author.

**Requirements:**

* comment must exist
* comment must belong to the user

**Effects:**

* deletes the comment

**Request Body:**

```json
{
  "user": "string",
  "comment": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Commenting/editComment

**Description:** Edits the content of an existing comment if the requesting user is its author.

**Requirements:**

* comment must exist
* comment must belong to the user
* new\_content cannot be empty

**Effects:**

* edits the comment content to be that of new\_content

**Request Body:**

```json
{
  "user": "string",
  "comment": "string",
  "new_content": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Commenting/\_getComment

**Description:** Retrieves the full details of a specific comment by its ID.

**Requirements:**

* (Implicit: comment ID must be provided)

**Effects:**

* Query to retrieve a specific comment. Returns an array for consistency with other queries.

**Request Body:**

```json
{
  "comment": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "comment": {
      "_id": "string",
      "author": "string",
      "content": "string",
      "post": "string",
      "createdAt": "date-time"
    }
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Commenting/\_getCommentsForPost

**Description:** Retrieves all comments associated with a given post, sorted from most recent to oldest.

**Requirements:**

* (Implicit: post ID must be provided)

**Effects:**

* Query to retrieve all comments for a given post, sorted from most recent to oldest.

**Request Body:**

```json
{
  "post": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "comment": {
      "_id": "string",
      "author": "string",
      "content": "string",
      "post": "string",
      "createdAt": "date-time"
    }
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Commenting/\_getCommentsByAuthor

**Description:** Retrieves all comments made by a specific user, sorted from most recent to oldest.

**Requirements:**

* (Implicit: author ID must be provided)

**Effects:**

* Query to retrieve all comments made by a given user, sorted from most recent to oldest.

**Request Body:**

```json
{
  "author": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "comment": {
      "_id": "string",
      "author": "string",
      "content": "string",
      "post": "string",
      "createdAt": "date-time"
    }
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
