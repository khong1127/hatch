[@api-extraction](api-extraction-from-code.md)

[@sync_functions](../../src/syncs/hatch.syncs.ts)

# prompt: Please extract an API for the sync functions. 

# response:

Based on the provided sync implementation file, here is the extracted API documentation.

# API Specification: Hatch Concepts

This document outlines the API endpoints exposed by the sync layer for various concepts including Commenting, Posting, Friending, File management, and Session Logging.

---

## Commenting Concept

### POST /api/Commenting/addComment

**Description:** Adds a new comment to a specified post.

**Requirements:**
- The user must be authenticated with a valid `session` ID.
- The target `post` must exist.
- The user must be the author of the post or be friends with the author.

**Effects:**
- Creates a new comment associated with the user and the target post.

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
---
### POST /api/Commenting/deleteComment

**Description:** Deletes a specific comment.

**Requirements:**
- The user must be authenticated with a valid `session` ID.
- The `comment` must exist.
- The user must be the author of the comment.

**Effects:**
- Deletes the specified comment from the system.

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
---

## Friending Concept

### POST /api/Friending/sendRequest

**Description:** Sends a friend request from the authenticated user to another user specified by username.

**Requirements:**
- The sender must be authenticated with a valid `session` ID.
- A user with the specified `toUsername` must exist.
- The sender cannot send a friend request to themselves.
- A friend request cannot be sent if the two users are already friends.

**Effects:**
- Creates a new pending friend request from the sender to the recipient.

**Request Body:**
```json
{
  "session": "string",
  "toUsername": "string"
}
```

**Success Response Body (Action):**
```json
{
  "friendRequest": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

## Posting Concept

### POST /api/Posting/create

**Description:** Creates a new post authored by the authenticated user.

**Requirements:**
- The user must be authenticated with a valid `session` ID.

**Effects:**
- Creates a new post with the provided content, authored by the logged-in user.

**Request Body:**
```json
{
  "session": "string",
  "content": "string"
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
---
### POST /api/Posting/delete

**Description:** Deletes a post created by the user.

**Requirements:**
- The user must be authenticated with a valid `session` ID.
- The `post` must exist.
- The user must be the author of the post.

**Effects:**
- Deletes the specified post and triggers the deletion of all associated comments.

**Request Body:**
```json
{
  "session": "string",
  "post": "string"
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
---

## File Concept

### POST /api/File/requestUploadUrl

**Description:** Requests a pre-signed URL to upload a file to storage.

**Requirements:**
- The user must be authenticated with a valid `session` ID.

**Effects:**
- Generates a unique file record and a temporary, secure URL for uploading file content.

**Request Body:**
```json
{
  "session": "string",
  "filename": "string",
  "contentType": "string"
}
```

**Success Response Body (Action):**
```json
{
  "fileId": "string",
  "uploadUrl": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/File/confirmUpload

**Description:** Confirms that a file has been successfully uploaded using the provided URL.

**Requirements:**
- The user must be authenticated with a valid `session` ID.
- The `fileId` must correspond to an existing file record.
- The user must be the owner of the file.

**Effects:**
- Marks the file record as successfully uploaded and available.

**Request Body:**
```json
{
  "session": "string",
  "fileId": "string"
}
```

**Success Response Body (Action):**
```json
{
  "success": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/File/_getFilesByOwner

**Description:** Retrieves a list of all files owned by the authenticated user.

**Requirements:**
- The user must be authenticated with a valid `session` ID.

**Effects:**
- Returns a list of file records belonging to the user.

**Request Body:**
```json
{
  "session": "string"
}
```

**Success Response Body (Query):**
```json
{
  "files": [
    {
      "_id": "string",
      "owner": "string",
      "filename": "string"
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
---

## SessionLogging Concept

### POST /api/SessionLogging/startSession

**Description:** Starts a new logging session for the authenticated user.

**Requirements:**
- The user must be authenticated with a valid `session` ID.

**Effects:**
- Creates a new, active logging session associated with the user.

**Request Body:**
```json
{
  "session": "string",
  "startTime": "number",
  "location": "object"
}
```

**Success Response Body (Action):**
```json
{
  "newSession": "string"
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

**Description:** Adds a new entry to one of the user's active logging sessions.

**Requirements:**
- The user must be authenticated with a valid `session` ID.
- The `sessionId` must exist and belong to the authenticated user.

**Effects:**
- Associates a new entry with the specified logging session.

**Request Body:**
```json
{
  "session": "string",
  "sessionId": "string",
  "entry": "object"
}
```

**Success Response Body (Action):**
```json
{
  "newEntry": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/SessionLogging/endSession

**Description:** Ends an active logging session, preventing new entries from being added.

**Requirements:**
- The user must be authenticated with a valid `session` ID.
- The `sessionId` must exist and belong to the authenticated user.

**Effects:**
- Sets the specified logging session to inactive.

**Request Body:**
```json
{
  "session": "string",
  "sessionId": "string"
}
```

**Success Response Body (Action):**
```json
{
  "status": "ended"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/SessionLogging/_getSessionsByUser

**Description:** Retrieves all logging sessions created by the authenticated user.

**Requirements:**
- The user must be authenticated with a valid `session` ID.

**Effects:**
- Returns a list of all session records owned by the user.

**Request Body:**
```json
{
  "session": "string"
}
```

**Success Response Body (Query):**
```json
{
  "sessions": [
    {
      "_id": "string",
      "user": "string",
      "active": "boolean"
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
---
### POST /api/SessionLogging/_getSessionDetails

**Description:** Retrieves the details of a specific logging session.

**Requirements:**
- The user must be authenticated with a valid `session` ID.
- The user must be the owner of the requested `sessionId`.

**Effects:**
- Returns the full record for the specified session.

**Request Body:**
```json
{
  "session": "string",
  "sessionId": "string"
}
```

**Success Response Body (Query):**
```json
{
  "sessionDetails": {
    "_id": "string",
    "user": "string",
    "active": "boolean"
  }
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/SessionLogging/_getEntriesInSession

**Description:** Retrieves all entries within a specific logging session.

**Requirements:**
- The user must be authenticated with a valid `session` ID.
- The user must be the owner of the specified `sessionId`.

**Effects:**
- Returns a list of all entry records for the given session.

**Request Body:**
```json
{
  "session": "string",
  "sessionId": "string"
}
```

**Success Response Body (Query):**
```json
{
  "entries": [
    {
      "_id": "string"
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
---
### POST /api/SessionLogging/_isSessionActive

**Description:** Checks if a specific logging session is currently active.

**Requirements:**
- The user must be authenticated with a valid `sessionToken`.
- The user must be the owner of the specified `sessionId`.

**Effects:**
- Returns the active status of the session.

**Request Body:**
```json
{
  "sessionToken": "string",
  "sessionId": "string"
}
```

**Success Response Body (Query):**
```json
{
  "isActive": "boolean"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

## PasswordAuthentication Concept

### POST /api/PasswordAuthentication/_getUserById

**Description:** Retrieves public user information by user ID.

**Requirements:**
- The user must be authenticated with a valid `session` ID.

**Effects:**
- Returns the public profile information for the user with the given `id`.

**Request Body:**
```json
{
  "session": "string",
  "id": "string"
}
```

**Success Response Body (Query):**
```json
{
  "user": {
    "_id": "string",
    "username": "string"
  }
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/PasswordAuthentication/_getUserByUsername

**Description:** Retrieves public user information by username.

**Requirements:**
- The user must be authenticated with a valid `session` ID.

**Effects:**
- Returns the public profile information for the user with the given `username`.

**Request Body:**
```json
{
  "session": "string",
  "username": "string"
}
```

**Success Response Body (Query):**
```json
{
  "user": {
    "_id": "string",
    "username": "string"
  }
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/PasswordAuthentication/_getAllUsers

**Description:** Retrieves a list of all users in the system.

**Requirements:**
- The user must be authenticated with a valid `session` ID.

**Effects:**
- Returns a list of all users.

**Request Body:**
```json
{
  "session": "string"
}
```

**Success Response Body (Query):**
```json
{
  "users": [
    {
      "_id": "string",
      "username": "string"
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
---