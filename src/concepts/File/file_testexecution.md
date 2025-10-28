FileConcept initialized.
--- Testing GCS_BUCKET requirement: missing env var ---
Requirement met: GCS_BUCKET env var is required

--- Testing requestUploadUrl: missing user ID ---
Requirement met: User ID must be provided.

--- Testing requestUploadUrl: missing filename ---
Requirement met: filename is required

--- Testing requestUploadUrl: successful request ---
Effect confirmed: uploadUrl=https://mock.signed.url/path, bucket=test-gcs-bucket-123, object=user123_test/1761627621223-document-with-spaces-special-chars.pdf
Effect confirmed: gcs.generateV4SignedUrl called with PUT method and correct params.

--- Testing confirmUpload: missing user ID ---
Requirement met: User ID must be provided.

--- Testing confirmUpload: missing object path ---
Requirement met: object is required

--- Testing confirmUpload: successful confirmation ---
Effect confirmed: file ID=019a2930-6ac0-776d-ab3c-9d8e4ce01270, URL=https://storage.googleapis.com/test-gcs-bucket-123/user123_test/test-uploaded-file.jpg
Effect confirmed: file metadata stored in database.

--- Testing getViewUrl: missing user ID ---
Requirement met: User ID must be provided.

--- Testing getViewUrl: missing object path ---
Requirement met: object is required

--- Testing getViewUrl: successful request ---
Effect confirmed: view URL=https://mock.signed.url/path
Effect confirmed: gcs.generateV4SignedUrl called with GET method and correct params.

--- Trace: Scenario - User 1 (TEST_USER_ID_1) uploads a report and User 2 uploads a profile picture ---
User 1 obtained upload URL for 'my-awesome-report.docx': https://mock.signed.url/path, Object: user123_test/1761627650522-my-awesome-report.docx
User 1 confirmed upload of 'my-awesome-report.docx'. File ID: 019a2930-b9db-7540-9a72-94131422dff1, Public URL: https://storage.googleapis.com/test-gcs-bucket-123/user123_test/1761627650522-my-awesome-report.docx
Principle fulfilled: Verified report file metadata in database.
User 2 obtained upload URL for 'profile-pic.png': https://mock.signed.url/path, Object: user456_test/1761627650589-profile-pic.png
User 2 confirmed upload of 'profile-pic.png'. File ID: 019a2930-ba1d-796b-90c9-044719fceadc, Public URL: https://storage.googleapis.com/test-gcs-bucket-123/user456_test/1761627650589-profile-pic.png
Principle fulfilled: Verified profile picture file metadata in database.
User 1 obtained view URL for 'my-awesome-report.docx': https://mock.signed.url/path
Principle fulfilled: Verified generateV4SignedUrl was called with GET for report.
Principle fulfilled: User 1 files found: user123_test/1761627650522-my-awesome-report.docx
Principle fulfilled: User 2 files found: user456_test/1761627650589-profile-pic.png
Principle fulfilled: Nonexistent user has no files, as expected.
