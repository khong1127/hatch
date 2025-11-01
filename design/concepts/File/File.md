[@api-spec](../../tools/apispec.md)

[@example-spec](../Posting/Posting.md)

# prompt: Please extract a specification for the File concept based on the API spec

# response:

**concept** File (User)

**purpose** manage user-owned files, supporting secure upload, storage, and retrieval of content

**principle** users can request a secure URL to upload a file, confirm the upload to store its metadata, and then request another secure URL to view the uploaded file, which remains accessible by its owner

**state**
  a set of Files with
    an owner User
    a bucket String
    an object String
    a contentType String
    a size Number
    a createdAt Date

**actions**
  requestUploadUrl (user: User, filename: String, contentType?: String, expiresInSeconds?: Number): (uploadUrl: String, bucket: String, object: String)
    **requires** user ID must be provided; filename must be provided; the `GCS_BUCKET` environment variable must be set on the server
    **effects** generates a new, time-limited, signed PUT URL valid for uploading a file to the configured cloud storage bucket; returns the `uploadUrl`, the target `bucket` name, and the generated `object` path for the file

  confirmUpload (user: User, object: String, contentType?: String, size?: Number): (file: FileId, url: String)
    **requires** user ID must be provided; object path (from `requestUploadUrl`) must be provided; the `GCS_BUCKET` environment variable must be set on the server
    **effects** creates a new FileId and stores a new file document in the database, associating it with the `user`, `bucket`, `object` path, `contentType`, `size`, and `createdAt` timestamp; returns the newly created `file` ID and a direct public `url` to the stored file

  getViewUrl (user: User, object: String, expiresInSeconds?: Number): (url: String)
    **requires** user ID must be provided; object path must be provided; the `GCS_BUCKET` environment variable must be set on the server
    **effects** generates a new, time-limited, signed GET URL for the specified `object` in the configured cloud storage bucket; returns the generated `url` for viewing the file; *Note: This action does not perform access control; it assumes the caller is authorized to view the file.*