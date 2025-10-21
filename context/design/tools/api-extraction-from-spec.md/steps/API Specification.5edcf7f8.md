---
timestamp: 'Sun Oct 19 2025 08:47:40 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_084740.11b22e41.md]]'
content_id: 5edcf7f8bf087ffb2dc70f8deede08cb11850be909cd7884eef617569cdca32d
---

# API Specification: Posting Concept

**Purpose:** allow users to publish and share content for others to see

***

## API Endpoints

### POST /api/Posting/create

**Description:** Creates a new post with a caption and a set of images, authored by the specified user.

**Requirements:**

* user to exist
* images cannot be empty

**Effects:**

* creates a new post authored by the user timestamped as now with its content being the caption and images given

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

**Description:** Deletes an existing post, provided the requesting user is the owner.

**Requirements:**

* user to exist
* post to exist and belong to user

**Effects:**

* deletes the post for the author and their friends

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

**Description:** Edits the caption of an existing post, provided the requesting user is the owner.

**Requirements:**

* user to exist
* post to exist and belong to user

**Effects:**

* edits the caption of the post to be that of the new one

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
