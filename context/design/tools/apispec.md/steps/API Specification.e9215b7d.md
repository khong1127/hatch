---
timestamp: 'Mon Oct 20 2025 23:24:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_232416.2ad8532b.md]]'
content_id: e9215b7d08701c99b406dfc8c6dde53daffbfd06d912ae4dcffbaf0ee4d8780a
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

### POST /api/Posting/\_getPostById

**Description:** Retrieves the full details of a specific post by its ID.

**Requirements:**

* (Implicit: post ID must be provided)

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

* (Implicit: user ID must be provided)

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
