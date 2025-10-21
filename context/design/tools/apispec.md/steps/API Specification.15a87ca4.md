---
timestamp: 'Mon Oct 20 2025 23:24:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_232416.2ad8532b.md]]'
content_id: 15a87ca48a6f12ce848b92669308feda6e5df86abe5bd3172a9bf19de6fe0663
---

# API Specification: SessionLogging Concept

**Purpose:** capture photo records of a user's activity during a trip session

***

## API Endpoints

### POST /api/SessionLogging/startSession

**Description:** Creates a new session (active = true) under the specified user.

**Requirements:**

* user to exist (as a valid ID in the system context)

**Effects:**

* creates a new session (active = true) under the specified user, returning the ID of the new session.

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

**Description:** Adds the specified image to the set of images associated with an active session owned by the user.

**Requirements:**

* user to exist
* session must exist
* image must exist (as a valid ID)
* session must be active
* session must belong to the user
* The image must not already be associated with the session.

**Effects:**

* adds the specified image to the set of images associated with the session.

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

**Description:** Sets the 'active' flag of the specified session to false.

**Requirements:**

* user to exist
* session must exist
* session must belong to the user
* Session must be active

**Effects:**

* sets the 'active' flag of the specified session to false.

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

**Description:** Returns a list of IDs for all sessions owned by the given user.

**Requirements:**

* (Implicit: user ID must be provided)

**Effects:**

* Returns a list of IDs for all sessions owned by the given user.

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

***

### POST /api/SessionLogging/\_getSessionDetails

**Description:** Returns the full details of a specific session, or an empty array if not found.

**Requirements:**

* (Implicit: session ID must be provided)

**Effects:**

* Returns an array containing the full details of a specific session, or an empty array if not found.

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

***

### POST /api/SessionLogging/\_getEntriesInSession

**Description:** Returns the list of image entry IDs for a given session.

**Requirements:**

* (Implicit: session ID must be provided)

**Effects:**

* Returns the list of image entry IDs for a given session.

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

***

### POST /api/SessionLogging/\_isSessionActive

**Description:** Returns whether the specified session is active.

**Requirements:**

* (Implicit: session ID must be provided)

**Effects:**

* Returns an array containing a single boolean (true if the session is active, false if inactive) or an empty array if the session is not found.

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
