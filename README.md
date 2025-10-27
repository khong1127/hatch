# 6.104 Assignment 4: Implementing Concepts

Here is a list of where to find different parts of my work:
* Concept specifications
  * design --> concepts --> (Concept Name) --> (Concept Name).md
* Concept files about design changes and other issues
  * design --> concepts --> (Concept Name) --> (Concept Name)_moments.md
* Concept implementation
  * src --> concepts --> (Concept Name) --> (Concept Name).ts
* Concept testing
  * src --> concepts --> (Concept Name) --> (Concept Name).test.ts
* Concept console test output
  * src --> concepts --> (Concept Name) --> (Concept Name)_testexecution.ts
* App-scope design changes and interesting moments
  * design --> learning --> design-changes-moments.md

## Google Cloud Storage integration (pre-signed uploads)

This server can generate V4 pre-signed upload URLs for Google Cloud Storage (so clients upload directly to GCS; the app stores only the resulting object URL as metadata).

Endpoint:

- POST `/api/storage/gcs/upload-url`
  - Body: `{ "bucket": "<bucket-name>", "object": "<path/filename>", "expiresInSeconds": 900 }`
  - Response: `{ "url": "https://storage.googleapis.com/...&X-Goog-Signature=..." }`
  - Use the returned URL to `PUT` the file bytes from the client.

Credentials:

- Either set env vars `GCS_CLIENT_EMAIL` and `GCS_PRIVATE_KEY` (private key in PKCS#8 PEM; escape newlines) 
  or set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON file path.

Example upload flow (manual, using curl):

1. Generate URL:
  - POST to `/api/storage/gcs/upload-url` with `{ bucket, object }`.
2. Upload bytes:
  - `curl -X PUT --upload-file ./local.jpg "<returned-url>"`
3. Store the final URL in your concept as a string:
  - `https://storage.googleapis.com/<bucket>/<path/filename>`

Notes:

- The signed URL expires (default 15 min; max 7 days). Generate new URLs when needed for uploads.
- You can also generate `GET` signed URLs similarly if you want time-limited downloads; otherwise, serve public objects directly.

### How to set up Google Cloud Storage (one-time)

The server does not create buckets for you. Perform these steps once in your GCP project:

1) Create or select a GCP project and enable the API
- In the Google Cloud Console, pick your project.
- Enable the "Cloud Storage" API if it isn’t already.

2) Create a bucket
- Create a bucket (e.g., `my-hatch-media`). Choose region/dual-region as needed.
- For friend-only/private access, leave the bucket private (do not grant public access).

3) Create a Service Account and grant permissions
- Create a service account (e.g., `hatch-media-uploader`).
- Grant it suitable roles on the bucket:
  - For uploads with signed URLs: `Storage Object Creator` is sufficient.
  - For managing/reading objects (if needed): add `Storage Object Viewer`.
  - For admin tasks: `Storage Object Admin` (broader; only if necessary).

4) Create credentials and set env in this app
- Option A: Service account JSON file
  - Create a key for the service account (JSON) and save it securely.
  - Set `GOOGLE_APPLICATION_CREDENTIALS` to the absolute path of that JSON.
- Option B: Environment variables
  - Extract `client_email` and `private_key` from the JSON and set:
    - `GCS_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"`
    - `GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
    - Note: The private key must keep literal `\n` newlines when set via `.env`.

5) Verify locally
- Start server: `deno task concepts`
- Request an upload URL:
  - POST `/api/storage/gcs/upload-url` with `{ "bucket": "my-hatch-media", "object": "uploads/test.jpg" }`
- Upload a file with the returned URL (from your shell or client code).
- If bucket is private, use `/api/storage/gcs/download-url` to get a short-lived GET URL to view the object.

Tip: You can keep objects private and only hand out short-lived GET URLs to authorized viewers (owner/friends).

### Friend-only (non-public) access

Keep your bucket private and do not expose public URLs. Instead:

- When a viewer requests a post, your server verifies access (e.g., owner or friend).
- For each image object path stored with the post, request a short-lived GET signed URL via:
  - POST `/api/storage/gcs/download-url` with `{ bucket, object, expiresInSeconds: 300 }`
- Return those short-lived URLs in the API response. Clients fetch images directly from GCS using those URLs.

This keeps objects private, but the links your clients receive will work for a few minutes and then expire. Re-generate on refresh or when opening the post again.

