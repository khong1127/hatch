---
timestamp: 'Thu Nov 06 2025 08:32:57 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_083257.79696642.md]]'
content_id: 0592b754a61adc0f0eede857bc4677636d5f00aa5cd3137db8af1224bd975f77
---

# API Specification: File Concept

**Purpose:** Manage user-owned files, supporting secure upload, storage, and retrieval of content.

***

## API Endpoints

### POST /api/File/requestUploadUrl

**Description:** Requests a time-limited, signed URL for securely uploading a file to cloud storage.

**Requirements:**

* `user` ID must be provided.
* `filename` must be provided.
* The `GCS_BUCKET` environment variable must be set on the server.

**Effects:**

* Generates a new, time-limited, signed PUT URL valid for uploading a file to the configured cloud storage bucket.
* Returns the `uploadUrl`, the target `bucket` name, and the generated `object` path for the file.

**Request Body:**

```json
{
  "user": "string",
  "filename": "string",
  "contentType": "string",
  "expiresInSeconds": "number"
}
```

**Success Response Body (Action):**

```json
{
  "uploadUrl": "string",
  "bucket": "string",
  "object": "string"
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

**Description:** Confirms a successful file upload by recording its metadata in the system.

**Requirements:**

* `user` ID must be provided.
* `object` path (from `requestUploadUrl`) must be provided.
* The `GCS_BUCKET` environment variable must be set on the server.

**Effects:**

* Creates a new `FileId` and stores a new file document in the database, associating it with the `user`, `bucket`, `object` path, `contentType`, `size`, and `createdAt` timestamp.
* Returns the newly created `file` ID and a direct public `url` to the stored file.

**Request Body:**

```json
{
  "user": "string",
  "object": "string",
  "contentType": "string",
  "size": "number"
}
```

**Success Response Body (Action):**

```json
{
  "file": "string",
  "url": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/File/getViewUrl

**Description:** Provides a time-limited, signed URL for securely viewing an existing file.

**Requirements:**

* `user` ID must be provided.
* `object` path must be provided.
* The `GCS_BUCKET` environment variable must be set on the server.

**Effects:**

* Generates a new, time-limited, signed GET URL for the specified `object` in the configured cloud storage bucket.
* Returns the generated `url` for viewing the file.
* *Note: This action does not perform access control; it assumes the caller is authorized to view the file.*

**Request Body:**

```json
{
  "user": "string",
  "object": "string",
  "expiresInSeconds": "number"
}
```

**Success Response Body (Action):**

```json
{
  "url": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/File/\_getFileById

**Description:** Retrieves the metadata for a specific file by its unique ID.

**Requirements:**

* `file` ID must be provided.

**Effects:**

* Returns an array containing a single object, where the `file` key holds the `FileDocument` metadata if found.
* Returns an empty array if no file with the given ID exists.

**Request Body:**

```json
{
  "file": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "file": {
      "_id": "string",
      "owner": "string",
      "bucket": "string",
      "object": "string",
      "contentType": "string",
      "size": "number",
      "createdAt": "string"
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

### POST /api/File/\_getFilesByOwner

**Description:** Retrieves a list of all file metadata documents owned by a specific user.

**Requirements:**

* `user` ID must be provided.

**Effects:**

* Returns an array containing a single object. This object has a `files` key, whose value is an array of `FileDocument`s associated with the given `user`, sorted by creation date (newest first).
* Returns an array containing a single object with an empty `files` array if the user has no files.

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
    "files": [
      {
        "_id": "string",
        "owner": "string",
        "bucket": "string",
        "object": "string",
        "contentType": "string",
        "size": "number",
        "createdAt": "string"
      }
    ]
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
