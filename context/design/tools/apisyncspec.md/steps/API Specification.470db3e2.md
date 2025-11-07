---
timestamp: 'Thu Nov 06 2025 08:23:32 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_082332.6c3fd8b7.md]]'
content_id: 470db3e2f17027953e44c3ebe4728f133f73e102c5a3800dc1db3db479ff1368
---

# API Specification: Hatch Syncs

**Purpose:** This document specifies the REST-like API endpoints for the application, which are orchestrated by sync functions to interact with underlying concepts like Commenting, Posting, and Friending.

***

## API Endpoints

### POST /api/Commenting/addComment

**Description:** Adds a comment to a specified post.

**Requirements:**

* The user must be authenticated via a valid `session` token.
* The target `post` must exist.
* The authenticated user must either be the author of the post or be friends with the author.

**Effects:**

* Creates a new comment with the provided content, associating it with the post and the authenticated user.

**Request Body:**

```json
{
  "session": "string",
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

**Description:** Deletes a specified comment.

**Requirements:**

* The user must be authenticated via a valid `session` token.
* The target `comment` must exist.
* The authenticated user must be the author of the comment.

**Effects:**

* Permanently deletes the specified comment.

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

***

### POST /api/Friending/sendRequest

**Description:** Sends a friend request to another user.

**Requirements:**

* The user must be authenticated via a valid `session` token.
* A user with the specified `toUsername` must exist.
* The sender and recipient cannot be the same user.
* A friend request cannot be sent if the users are already friends.

**Effects:**

* Creates a new pending friend request from the authenticated user to the specified recipient.

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

***

### POST /api/Posting/create

**Description:** Creates a new post authored by the authenticated user.

**Requirements:**

* The user must be authenticated via a valid `session` token.

**Effects:**

* Creates a new post with the provided `content`, authored by the authenticated user.

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

***

### POST /api/Posting/delete

**Description:** Deletes a specified post.

**Requirements:**

* The user must be authenticated via a valid `session` token.
* The target `post` must exist.
* The authenticated user must be the author of the post.

**Effects:**

* Permanently deletes the specified post and all associated comments.

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

***

### POST /api/File/requestUploadUrl

**Description:** Requests a pre-signed URL for uploading a file to cloud storage.

**Requirements:**

* The user must be authenticated via a valid `session` token.

**Effects:**

* Creates a file record and returns a temporary, secure URL for uploading the file content.

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

***

### POST /api/File/confirmUpload

**Description:** Confirms that a file has been successfully uploaded using the pre-signed URL.

**Requirements:**

* The user must be authenticated via a valid `session` token.
* The `fileId` must correspond to an existing file record.
* The authenticated user must be the owner of the file.

**Effects:**

* Marks the file record as "uploaded" and available for use.

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

***

### POST /api/File/\_getFilesByOwner

**Description:** Retrieves a list of files owned by the authenticated user.

**Requirements:**

* The user must be authenticated via a valid `session` token.

**Effects:**

* Returns a list of file records owned by the user.

**Request Body:**

```json
{
  "session": "string"
}
```

**Success Response Body (Query):**

```json
{
  "files": "[{...}]"
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

**Description:** Ends the current session, effectively logging the user out.

**Requirements:**

* A valid `session` token must be provided.

**Effects:**

* Marks the session as inactive, invalidating the token for future authenticated requests.

**Request Body:**

```json
{
  "session": "string"
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

***

### POST /api/SessionLogging/\_isSessionActive

**Description:** Checks if the provided session token is currently active and valid.

**Requirements:**

* A `session` token must be provided.

**Effects:**

* Returns the active status of the session.

**Request Body:**

```json
{
  "session": "string"
}
```

**Success Response Body (Query):**

```json
{
  "active": true
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuthentication/\_getUserById

**Description:** Retrieves public information for a user by their unique ID.

**Requirements:**

* The requesting user must be authenticated via a valid `session` token.

**Effects:**

* Returns the user object corresponding to the given ID.

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
  "user": "{...}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuthentication/\_getUserByUsername

**Description:** Retrieves public information for a user by their username.

**Requirements:**

* The requesting user must be authenticated via a valid `session` token.

**Effects:**

* Returns the user object corresponding to the given username.

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
  "user": "{...}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuthentication/\_getAllUsers

**Description:** Retrieves a list of all users in the system.

**Requirements:**

* The requesting user must be authenticated via a valid `session` token.

**Effects:**

* Returns an array containing all user objects.

**Request Body:**

```json
{
  "session": "string"
}
```

**Success Response Body (Query):**

```json
{
  "users": "[{...}]"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
