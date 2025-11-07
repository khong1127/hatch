[@api-extraction](api-extraction-from-code.md)

# prompt: Please update the API for the following concept based on the changes that have been made: Friending

Current API spec:

# API Specification: SessionLogging Concept

**Purpose:** capture photo records of a user's activity during a trip session

---

## API Endpoints

### POST /api/SessionLogging/startSession

**Description:** Creates a new session (active = true) under the specified user.

**Requirements:**
- user to exist (as a valid ID in the system context)

**Effects:**
- creates a new session (active = true) under the specified user, returning the ID of the new session.

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

---

### POST /api/SessionLogging/addEntry

**Description:** Adds the specified image to the set of images associated with an active session owned by the user.

**Requirements:**
- user to exist
- session must exist
- image must exist (as a valid ID)
- session must be active
- session must belong to the user
- The image must not already be associated with the session.

**Effects:**
- adds the specified image to the set of images associated with the session.

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

---

### POST /api/SessionLogging/endSession

**Description:** Sets the 'active' flag of the specified session to false.

**Requirements:**
- user to exist
- session must exist
- session must belong to the user
- Session must be active

**Effects:**
- sets the 'active' flag of the specified session to false.

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

---

### POST /api/SessionLogging/_getSessionsByUser

**Description:** Returns a list of IDs for all sessions owned by the given user.

**Requirements:**
- (Implicit: user ID must be provided)

**Effects:**
- Returns a list of IDs for all sessions owned by the given user.

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
    "sessions": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/SessionLogging/_getSessionDetails

**Description:** Returns the full details of a specific session, or an empty array if not found.

**Requirements:**
- (Implicit: session ID must be provided)

**Effects:**
- Returns an array containing the full details of a specific session, or an empty array if not found.

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
    "details": {
      "_id": "string",
      "owner": "string",
      "images": [
        "string"
      ],
      "active": "boolean"
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

---

### POST /api/SessionLogging/_getEntriesInSession

**Description:** Returns the list of image entry IDs for a given session.

**Requirements:**
- (Implicit: session ID must be provided)

**Effects:**
- Returns the list of image entry IDs for a given session.

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
    "images": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/SessionLogging/_isSessionActive

**Description:** Returns whether the specified session is active.

**Requirements:**
- (Implicit: session ID must be provided)

**Effects:**
- Returns an array containing a single boolean (true if the session is active, false if inactive) or an empty array if the session is not found.

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
---

Code:
[@SessionLoggingConcept.ts](../../src/concepts/SessionLogging/SessionLoggingConcept.ts)

# response:

Based on my analysis of the concept implementation, here is the updated API specification.

# API Specification: SessionLogging Concept

**Purpose:** capture photo records of a user's activity during a trip session

---

## API Endpoints

### POST /api/SessionLogging/startSession

**Description:** Creates a new, active session for the specified user.

**Requirements:**
- The provided `user` must exist.

**Effects:**
- Creates a new session associated with the `user`.
- The new session is marked as `active`.
- Returns the unique ID of the newly created session.

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
---
### POST /api/SessionLogging/addEntry

**Description:** Adds an image to an active session owned by the user.

**Requirements:**
- The `user`, `session`, and `image` must all exist.
- The session must be `active`.
- The session must be owned by the `user`.
- The image must not already be in the session's image set.

**Effects:**
- Adds the `image` ID to the set of images for the specified `session`.

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
---
### POST /api/SessionLogging/endSession

**Description:** Deactivates a session, preventing new entries from being added.

**Requirements:**
- The `user` and `session` must exist.
- The session must be owned by the `user`.
- The session must currently be `active`.

**Effects:**
- Sets the `active` status of the session to `false`.

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
---
### POST /api/SessionLogging/_getSessionsByUser

**Description:** Retrieves all session IDs owned by a specific user.

**Requirements:**
- A valid `user` ID must be provided.

**Effects:**
- Returns a list of objects, each containing a session ID owned by the user.

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
---
### POST /api/SessionLogging/_getSessionDetails

**Description:** Retrieves the complete details for a specific session.

**Requirements:**
- A valid `session` ID must be provided.

**Effects:**
- Returns an array containing a single object with the session's details, or an empty array if not found.

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
---
### POST /api/SessionLogging/_getEntriesInSession

**Description:** Retrieves all image IDs associated with a specific session.

**Requirements:**
- A valid `session` ID must be provided.

**Effects:**
- Returns a list of objects, each containing an image ID from the session.

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
---
### POST /api/SessionLogging/_isSessionActive

**Description:** Checks if a specific session is currently active.

**Requirements:**
- A valid `session` ID must be provided.

**Effects:**
- Returns an array containing a single object with the session's active status, or an empty array if not found.

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
---