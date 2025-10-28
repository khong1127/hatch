---
timestamp: 'Tue Oct 28 2025 01:04:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251028_010435.fafa7f0a.md]]'
content_id: 40e6d660b5b9dde9a959970c22321b1413e1139bca63365774770dee4ed248e5
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
      },
      {
        "_id": "string",
        "owner": "string",
        "bucket": "string",
        "object": "string",
        "contentType": "string",
        "size": "number",
        "createdAt": "string"
      }
      // ... more FileDocument objects
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

**Concept: Posting (User, Image, Date)**

* **purpose** allow users to publish and share content for others to see
* **principle** users can create/publish posts that consist of a caption and at least one image. These posts can be edited and deleted by their owners.
* **state**
  * a set of Posts with
    * a caption String
    * a set of Images
    * an author User
    * a creation date Date
* **actions**
  * create (user: User, images: Set<Image>, caption: String): (post: Post)
    * *requires* user to exist, images cannot be empty
    * *effects* creates a new post authored by the user timestamped as now with its content being the caption and images given
  * delete (user: User, post: Post):
    * *requires* user to exist, post to exist and belong to user
    * *effects* deletes the post for the author and their friends
  * edit (user: User, post: Post, new\_caption: String)
    * *requires* user to exist, post to exist and belong to user
    * *effects* edits the caption of the post to be that of the new one
