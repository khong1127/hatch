---
timestamp: 'Thu Nov 06 2025 08:40:13 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_084013.8865d2cb.md]]'
content_id: 27d6dcf37ccdc2cc79b1ebe53e394005c28f05fa8451330625634c0d6fbecfbb
---

# API Specification: Posting Concept

**Purpose:** allow users to publish and share content for others to see

***

## API Endpoints

### POST /api/Posting/create

**Description:** Creates a new post authored by a user, including a caption and at least one image.

**Requirements:**

* user to exist
* images cannot be empty

**Effects:**

* creates a new post authored by the user with its content being the caption and images given.

**Request Body:**

```json
{
  "user": "string",
  "images": [
    "string"
  ],
  "caption": "string"
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

**Description:** Deletes a post if the requesting user is its author.

**Requirements:**

* user to exist
* post to exist and belong to user

**Effects:**

* deletes the post.

**Request Body:**

```json
{
  "user": "string",
  "post": "string"
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

### POST /api/Posting/edit

**Description:** Edits the caption of an existing post if the requesting user is its author.

**Requirements:**

* user to exist
* post to exist and belong to user

**Effects:**

* edits the caption of the post to be that of the new one.

**Request Body:**

```json
{
  "user": "string",
  "post": "string",
  "new_caption": "string"
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

### POST /api/Posting/getFeedForUser

**Description:** Retrieves a feed of posts from the user's friends, sorted from most recent to oldest.

**Requirements:**

* user exists

**Effects:**

* returns an array of posts from the user's friends, sorted by most recent

**Request Body:**

```json
{
  "user": "string"
}
```

**Success Response Body (Action):**

```json
{
  "posts": [
    {
      "_id": "string",
      "author": "string",
      "caption": "string",
      "images": ["string"],
      "createdAt": "date-time"
    }
  ]
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Posting/\_getPostById

**Description:** Retrieves the full details of a specific post by its ID.

**Requirements:**

* post exists

**Effects:**

* Returns the details of a specific post as an array.

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
    "postDetails": {
      "_id": "string",
      "caption": "string",
      "images": [
        "string"
      ],
      "author": "string",
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

### POST /api/Posting/\_getPostsByAuthor

**Description:** Retrieves all posts authored by a specific user, sorted from most recent to oldest.

**Requirements:**

* user exists

**Effects:**

* Returns all posts authored by a specific user from most recent to oldest.

**Request Body:**

```json
{
  "user": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "post": {
      "_id": "string",
      "caption": "string",
      "images": [
        "string"
      ],
      "author": "string",
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
