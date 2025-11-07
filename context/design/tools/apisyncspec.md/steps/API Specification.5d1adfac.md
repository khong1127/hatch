---
timestamp: 'Thu Nov 06 2025 10:11:24 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_101124.06c57f66.md]]'
content_id: 5d1adfac4ff69e1644305511d77d181f40cde691235e4602603f4ce9f0deda66
---

# API Specification: File Concept

**Purpose:** Manages file uploads and access.

***

## API Endpoints

### POST /api/File/requestUploadUrl

**Description:** Requests a pre-signed URL to upload a file to storage.

**Requirements:**

* The user must be authenticated (a valid `session` token is required).

**Effects:**

* Creates a file metadata record and returns a temporary, secure URL for the client to upload the file directly.

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

**Description:** Confirms that a file has been successfully uploaded using the provided URL.

**Requirements:**

* The user must be authenticated (a valid `session` token is required).
* The file specified by `fileId` must exist.
* The user must be the owner of the file.

**Effects:**

* Marks the file's status as uploaded and complete.

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

**Description:** Retrieves a list of all files owned by the authenticated user.

**Requirements:**

* The user must be authenticated (a valid `session` token is required).

**Effects:**

* Returns a list of file metadata records for all files belonging to the user.

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
    "fileId": "string",
    "owner": "string",
    "filename": "string",
    "contentType": "string",
    "uploaded": "boolean"
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
