---
timestamp: 'Thu Nov 06 2025 08:47:53 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_084753.06433558.md]]'
content_id: cdfaece8596f99680e50eb1e05b09c29866c2b0168866030bcd24f6f734b2afc
---

# API Specification: SessionLogging Concept

**Purpose:** capture photo records of a user's activity during a trip session

***

## API Endpoints

### POST /api/SessionLogging/startSession

**Description:** Creates a new, active session for the specified user.

**Requirements:**

* The provided `user` must exist.

**Effects:**

* Creates a new session associated with the `user`.
* The new session is marked as `active`.
* Returns the unique ID of the newly created session.

**Request Body:**

```json
{
  "user": "string"
}
```

**Success Response Body (Action):**

```json
{
  "session": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SessionLogging/addEntry

**Description:** Adds an image to an active session owned by the user.

**Requirements:**

* The `user`, `session`, and `image` must all exist.
* The session must be `active`.
* The session must be owned by the `user`.
* The image must not already be in the session's image set.

**Effects:**

* Adds the `image` ID to the set of images for the specified `session`.

**Request Body:**

```json
{
  "user": "string",
  "session": "string",
  "image": "string"
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

### POST /api/SessionLogging/endSession

**Description:** Deactivates a session, preventing new entries from being added.

**Requirements:**

* The `user` and `session` must exist.
* The session must be owned by the `user`.
* The session must currently be `active`.

**Effects:**

* Sets the `active` status of the session to `false`.

**Request Body:**

```json
{
  "user": "string",
  "session": "string"
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

### POST /api/SessionLogging/\_getSessionsByUser

**Description:** Retrieves all session IDs owned by a specific user.

**Requirements:**

* A valid `user` ID must be provided.

**Effects:**

* Returns a list of objects, each containing a session ID owned by the user.

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
    "session": "string"
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

### POST /api/SessionLogging/\_getSessionDetails

**Description:** Retrieves the complete details for a specific session.

**Requirements:**

* A valid `session` ID must be provided.

**Effects:**

* Returns an array containing a single object with the session's details, or an empty array if not found.

**Request Body:**

```json
{
  "session": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "string",
    "owner": "string",
    "images": [
      "string"
    ],
    "active": "boolean"
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

### POST /api/SessionLogging/\_getEntriesInSession

**Description:** Retrieves all image IDs associated with a specific session.

**Requirements:**

* A valid `session` ID must be provided.

**Effects:**

* Returns a list of objects, each containing an image ID from the session.

**Request Body:**

```json
{
  "session": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "image": "string"
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

### POST /api/SessionLogging/\_isSessionActive

**Description:** Checks if a specific session is currently active.

**Requirements:**

* A valid `session` ID must be provided.

**Effects:**

* Returns an array containing a single object with the session's active status, or an empty array if not found.

**Request Body:**

```json
{
  "session": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "active": "boolean"
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
