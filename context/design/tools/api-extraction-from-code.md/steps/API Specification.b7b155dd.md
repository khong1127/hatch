---
timestamp: 'Mon Oct 20 2025 03:12:39 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_031239.129ab837.md]]'
content_id: b7b155dd9a0bbee73f4ff11e93f3850b75b221846284c37519ef3abc826d103c
---

# API Specification: Commenting Concept

**Purpose:** enable discussion around shared posts

***

## API Endpoints

### POST /api/Commenting/addComment

**Description:** Adds a new comment to a specified post by a given author, returning the ID of the new comment.

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

**Description:** Deletes an existing comment if the specified user is its author.

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

**Description:** Edits the content of an existing comment if the specified user is its author.

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

**Description:** Query to retrieve a specific comment. Returns an array for consistency with other queries.

**Requirements:**

* comment with ID '{comment}' must be found

**Effects:**

* Returns an array containing the specified comment if found.

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
    "comments": [
      {
        "_id": "string",
        "author": "string",
        "content": "string",
        "post": "string",
        "createdAt": "string"
      }
    ]
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

**Description:** Query to retrieve all comments for a given post, sorted from most recent to oldest.

**Requirements:**

* (No explicit requirements other than the `post` parameter being valid)

**Effects:**

* Returns a list of all comments for the given post, sorted by creation date (most recent first).

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
    "comments": [
      {
        "_id": "string",
        "author": "string",
        "content": "string",
        "post": "string",
        "createdAt": "string"
      }
    ]
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

**Description:** Query to retrieve all comments made by a given user, sorted from most recent to oldest.

**Requirements:**

* (No explicit requirements other than the `author` parameter being valid)

**Effects:**

* Returns a list of all comments made by the given author, sorted by creation date (most recent first).

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
    "comments": [
      {
        "_id": "string",
        "author": "string",
        "content": "string",
        "post": "string",
        "createdAt": "string"
      }
    ]
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
