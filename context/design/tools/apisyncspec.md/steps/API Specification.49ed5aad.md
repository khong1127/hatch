---
timestamp: 'Thu Nov 06 2025 10:11:24 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_101124.06c57f66.md]]'
content_id: 49ed5aad36a1b12cde6415d908d121e58b389f37b39695139beb5c66acc28a9b
---

# API Specification: SessionLogging Concept

**Purpose:** Manages activity sessions, such as birding trips, including starting, ending, and logging entries.

***

## API Endpoints

### POST /api/SessionLogging/startSession

**Description:** Starts a new activity session for the authenticated user.

**Requirements:**

* The user must be authenticated (a valid `sessionToken` is required).

**Effects:**

* Creates a new, active session owned by the user.

**Request Body:**

```json
{
  "sessionToken": "string",
  "location": "string",
  "notes": "string"
}
```

**Success Response Body (Action):**

```json
{
  "birdingSession": "{object}"
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

**Description:** Adds a new entry to an active session.

**Requirements:**

* The user must be authenticated (a valid `sessionToken` is required).
* The session specified by `sessionId` must exist.
* The user must be the owner of the session.
* The session must be active.

**Effects:**

* Creates a new entry within the specified session.

**Request Body:**

```json
{
  "sessionToken": "string",
  "sessionId": "string",
  "species": "string",
  "count": "number",
  "notes": "string"
}
```

**Success Response Body (Action):**

```json
{
  "entry": "{object}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SessionLogging/endSession

**Description:** Ends an active session, preventing new entries from being added.

**Requirements:**

* The user must be authenticated (a valid `sessionToken` is required).
* The session specified by `sessionId` must exist.
* The user must be the owner of the session.
* The session must be active.

**Effects:**

* Marks the session as inactive.

**Request Body:**

```json
{
  "sessionToken": "string",
  "sessionId": "string",
  "endTime": "string"
}
```

**Success Response Body (Action):**

```json
{
  "status": "ok"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SessionLogging/\_getSessionsByUser

**Description:** Retrieves all sessions owned by the authenticated user.

**Requirements:**

* The user must be authenticated (a valid `sessionToken` is required).

**Effects:**

* Returns a list of all sessions belonging to the user.

**Request Body:**

```json
{
  "sessionToken": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "sessionId": "string",
    "user": "string",
    "location": "string",
    "notes": "string",
    "startTime": "string",
    "endTime": "string",
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

### POST /api/SessionLogging/\_getSessionDetails

**Description:** Retrieves the details of a single session.

**Requirements:**

* The user must be authenticated (a valid `sessionToken` is required).
* The session specified by `sessionId` must exist.
* The user must be the owner of the session.

**Effects:**

* Returns the complete details for the specified session.

**Request Body:**

```json
{
  "sessionToken": "string",
  "sessionId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "sessionId": "string",
    "user": "string",
    "location": "string",
    "notes": "string",
    "startTime": "string",
    "endTime": "string",
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

**Description:** Retrieves all entries recorded in a specific session.

**Requirements:**

* The user must be authenticated (a valid `sessionToken` is required).
* The session specified by `sessionId` must exist.
* The user must be the owner of the session.

**Effects:**

* Returns a list of all entries for the specified session.

**Request Body:**

```json
{
  "sessionToken": "string",
  "sessionId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "entryId": "string",
    "sessionId": "string",
    "species": "string",
    "count": "number",
    "notes": "string"
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

* The user must be authenticated (a valid `sessionToken` is required).
* The session specified by `sessionId` must exist.
* The user must be the owner of the session.

**Effects:**

* Returns the active status of the specified session.

**Request Body:**

```json
{
  "sessionToken": "string",
  "sessionId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "isActive": "boolean"
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
