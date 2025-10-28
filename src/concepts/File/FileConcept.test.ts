import {
  assertEquals,
  assertExists,
  assertObjectMatch,
  fail,
} from "@std/assert";
import { testDb } from "@utils/database.ts";
import FileConcept from "./FileConcept.ts";
import { ID } from "@utils/types.ts"; // Assuming ID is exported from here
import * as gcs from "@utils/gcs.ts";

// Lightweight local implementation of withTemporaryEnv to avoid relying on external jsr package.
// It temporarily sets/unsets the provided env vars for the duration of the callback and restores originals.
async function withTemporaryEnv(
  vars: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
) {
  const original: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    original[key] = Deno.env.get(key);
    try {
      if (vars[key] === undefined) {
        Deno.env.delete(key);
      } else {
        Deno.env.set(key, vars[key]!);
      }
    } catch {
      // Ignore permission errors or readonly env in some runtimes.
    }
  }

  try {
    await fn();
  } finally {
    for (const key of Object.keys(vars)) {
      const val = original[key];
      try {
        if (val === undefined) {
          Deno.env.delete(key);
        } else {
          Deno.env.set(key, val);
        }
      } catch {
        // Ignore permission errors when restoring.
      }
    }
  }
}

const mockSignedUrl = "https://mock.signed.url/path";

function createMockSigner() {
  const calls: gcs.GcsSignOptions[] = [];
  const signer = (opts: gcs.GcsSignOptions) => {
    calls.push(opts);
    return Promise.resolve(mockSignedUrl);
  };
  return { signer, calls };
}

// Define some constant user IDs for testing
const TEST_USER_ID_1 = "user123_test" as ID;
const TEST_USER_ID_2 = "user456_test" as ID;
const TEST_BUCKET = "test-gcs-bucket-123";

Deno.test("FileConcept: initialization and bucket requirement", async (t) => {
  const [db, client] = await testDb();
  const fileConcept = new FileConcept(db);

  await t.step("should initialize successfully", () => {
    assertExists(fileConcept);
    console.log("FileConcept initialized.");
  });

  await t.step(
    "should return error if GCS_BUCKET env var is not set when an action is called",
    async () => {
      console.log("--- Testing GCS_BUCKET requirement: missing env var ---");
      // Use withTemporaryEnv to temporarily unset GCS_BUCKET for this step
      await withTemporaryEnv({ GCS_BUCKET: undefined }, async () => {
        // Re-instantiate concept or ensure `requireBucket` checks env var at call time
        const fileConceptWithoutBucket = new FileConcept(db);
        const result = await fileConceptWithoutBucket.requestUploadUrl({
          user: TEST_USER_ID_1,
          filename: "test.txt",
        });
        assertObjectMatch(result, { error: "GCS_BUCKET env var is required" });
        if ("error" in result) console.log(`Requirement met: ${result.error}`);
      });
    },
  );

  await client.close();
});

Deno.test("FileConcept: requestUploadUrl action", async (t) => {
  const [db, client] = await testDb();
  const { signer, calls } = createMockSigner();
  const fileConcept = new FileConcept(db, { signUrl: signer });

  await withTemporaryEnv({ GCS_BUCKET: TEST_BUCKET }, async () => {
    await t.step("requires: user ID must be provided", async () => {
      console.log(
        "\n--- Testing requestUploadUrl: missing user ID ---",
      );
      const result = await fileConcept.requestUploadUrl({
        user: "" as ID, // Intentionally pass an empty ID
        filename: "my-file.txt",
      });
      assertObjectMatch(result, { error: "User ID must be provided." });
      if ("error" in result) console.log(`Requirement met: ${result.error}`);
    });

    await t.step("requires: filename must be provided", async () => {
      console.log(
        "\n--- Testing requestUploadUrl: missing filename ---",
      );
      const result = await fileConcept.requestUploadUrl({
        user: TEST_USER_ID_1,
        filename: "",
      });
      assertObjectMatch(result, { error: "filename is required" });
      if ("error" in result) console.log(`Requirement met: ${result.error}`);
    });

    await t.step(
      "effects: returns uploadUrl, bucket, and object on success",
      async () => {
        console.log(
          "\n--- Testing requestUploadUrl: successful request ---",
        );
        const filename = "document-with spaces & special/chars.pdf";
        const contentType = "application/pdf";
        const expiresIn = 3600;
        const result = await fileConcept.requestUploadUrl({
          user: TEST_USER_ID_1,
          filename,
          contentType,
          expiresInSeconds: expiresIn,
        });

        if (
          !("uploadUrl" in result && "bucket" in result && "object" in result)
        ) {
          fail("Expected a successful upload URL response");
        }
        const successResult = result as {
          uploadUrl: string;
          bucket: string;
          object: string;
        };
        assertEquals(
          successResult.uploadUrl,
          mockSignedUrl,
          "Mock signed URL should be returned",
        );
        assertEquals(
          successResult.bucket,
          TEST_BUCKET,
          "Bucket should match env var",
        );
        // Verify object path includes user ID and sanitized filename, with a dynamic timestamp
        assertExists(
          successResult.object.match(
            new RegExp(
              `${TEST_USER_ID_1}/\\d+-document-with-spaces-special-chars.pdf`,
            ),
          ),
          "Object path should follow the user-timestamp-sanitized-filename pattern",
        );
        console.log(
          `Effect confirmed: uploadUrl=${successResult.uploadUrl}, bucket=${successResult.bucket}, object=${successResult.object}`,
        );

        // Verify gcs.generateV4SignedUrl was called with correct parameters
        const spyCall = calls[0];
        assertExists(spyCall, "signer should have been called");
        assertObjectMatch(
          spyCall,
          {
            method: "PUT",
            bucket: TEST_BUCKET,
            // The object path includes a dynamic timestamp, so we check just the static parts
            expiresInSeconds: expiresIn,
          },
          "signer should be called with correct PUT method and expiresInSeconds",
        );
        console.log(
          "Effect confirmed: gcs.generateV4SignedUrl called with PUT method and correct params.",
        );
      },
    );
  });

  await client.close();
});

Deno.test("FileConcept: confirmUpload action", async (t) => {
  const [db, client] = await testDb();
  const fileConcept = new FileConcept(db);

  await withTemporaryEnv({ GCS_BUCKET: TEST_BUCKET }, async () => {
    await t.step("requires: user ID must be provided", async () => {
      console.log(
        "\n--- Testing confirmUpload: missing user ID ---",
      );
      const objectPath = `${TEST_USER_ID_1}/some-file.txt`;
      const result = await fileConcept.confirmUpload({
        user: "" as ID,
        object: objectPath,
      });
      assertObjectMatch(result, { error: "User ID must be provided." });
      if ("error" in result) console.log(`Requirement met: ${result.error}`);
    });

    await t.step("requires: object path must be provided", async () => {
      console.log(
        "\n--- Testing confirmUpload: missing object path ---",
      );
      const result = await fileConcept.confirmUpload({
        user: TEST_USER_ID_1,
        object: "",
      });
      assertObjectMatch(result, { error: "object is required" });
      if ("error" in result) console.log(`Requirement met: ${result.error}`);
    });

    await t.step(
      "effects: inserts file metadata and returns file ID and URL on success",
      async () => {
        console.log(
          "\n--- Testing confirmUpload: successful confirmation ---",
        );
        const objectPath = `${TEST_USER_ID_1}/test-uploaded-file.jpg`;
        const contentType = "image/jpeg";
        const size = 12345;
        const result = await fileConcept.confirmUpload({
          user: TEST_USER_ID_1,
          object: objectPath,
          contentType,
          size,
        });

        if (!("file" in result && "url" in result)) {
          fail("Expected a successful confirmUpload response");
        }

        const successResult = result as { file: ID; url: string };
        console.log(
          `Effect confirmed: file ID=${successResult.file}, URL=${successResult.url}`,
        );

        // Verify URL format
        assertEquals(
          successResult.url,
          `https://storage.googleapis.com/${TEST_BUCKET}/${objectPath}`,
          "Public URL should follow GCS direct access pattern",
        );

        // Verify that the document was inserted into the database
        const { file: storedFile } = await fileConcept._getFileById({
          file: successResult.file,
        });
        assertExists(
          storedFile,
          "File document should exist in the database after confirmation",
        );
        assertObjectMatch(storedFile, {
          _id: successResult.file,
          owner: TEST_USER_ID_1,
          bucket: TEST_BUCKET,
          object: objectPath,
          contentType,
          size,
        }, "Stored file document should match provided metadata");
        assertExists(
          storedFile.createdAt,
          "createdAt timestamp should exist in the stored document",
        );
        console.log("Effect confirmed: file metadata stored in database.");
      },
    );
  });

  await client.close();
});

Deno.test("FileConcept: getViewUrl action", async (t) => {
  const [db, client] = await testDb();
  const { signer, calls } = createMockSigner();
  const fileConcept = new FileConcept(db, { signUrl: signer });

  await withTemporaryEnv({ GCS_BUCKET: TEST_BUCKET }, async () => {
    await t.step("requires: user ID must be provided", async () => {
      console.log(
        "\n--- Testing getViewUrl: missing user ID ---",
      );
      const objectPath = `${TEST_USER_ID_1}/another-file.png`;
      const result = await fileConcept.getViewUrl({
        user: "" as ID,
        object: objectPath,
      });
      assertObjectMatch(result, { error: "User ID must be provided." });
      if ("error" in result) console.log(`Requirement met: ${result.error}`);
    });

    await t.step("requires: object path must be provided", async () => {
      console.log(
        "\n--- Testing getViewUrl: missing object path ---",
      );
      const result = await fileConcept.getViewUrl({
        user: TEST_USER_ID_1,
        object: "",
      });
      assertObjectMatch(result, { error: "object is required" });
      if ("error" in result) console.log(`Requirement met: ${result.error}`);
    });

    await t.step("effects: returns a signed view URL on success", async () => {
      console.log(
        "\n--- Testing getViewUrl: successful request ---",
      );
      const objectPath = `${TEST_USER_ID_1}/my-image.gif`;
      const expiresIn = 600;
      const result = await fileConcept.getViewUrl({
        user: TEST_USER_ID_1,
        object: objectPath,
        expiresInSeconds: expiresIn,
      });

      if (!("url" in result)) {
        fail("Expected a successful getViewUrl response");
      }
      const successResult = result as { url: string };
      assertEquals(
        successResult.url,
        mockSignedUrl,
        "Mock signed URL should be returned",
      );
      console.log(`Effect confirmed: view URL=${successResult.url}`);

      // Verify gcs.generateV4SignedUrl was called with correct parameters
      const spyCall = calls[0];
      assertExists(spyCall, "signer should have been called");
      assertObjectMatch(
        spyCall,
        {
          method: "GET",
          bucket: TEST_BUCKET,
          object: objectPath,
          expiresInSeconds: expiresIn,
        },
        "signer should be called with correct GET method and expiresInSeconds",
      );
      console.log(
        "Effect confirmed: gcs.generateV4SignedUrl called with GET method and correct params.",
      );
    });
  });

  await client.close();
});

// # trace: Principle fulfillment for file upload and viewing
Deno.test("FileConcept: principle fulfillment - User uploads and views files", async (t) => {
  const [db, client] = await testDb();
  const { signer, calls } = createMockSigner();
  const fileConcept = new FileConcept(db, { signUrl: signer });

  const filename1 = "my-awesome-report.docx";
  const contentType1 =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const size1 = 50000;

  const filename2 = "profile-pic.png";
  const contentType2 = "image/png";
  const size2 = 15000;

  let uploadedFileId1: ID;
  let objectPath1: string;

  let uploadedFileId2: ID;
  let objectPath2: string;

  await withTemporaryEnv({ GCS_BUCKET: TEST_BUCKET }, async () => {
    console.log(
      "\n--- Trace: Scenario - User 1 (TEST_USER_ID_1) uploads a report and User 2 uploads a profile picture ---",
    );

    // --- User 1 Upload Process ---
    await t.step(
      "Step 1 (User 1): Request an upload URL for the report",
      async () => {
        const requestResult = await fileConcept.requestUploadUrl({
          user: TEST_USER_ID_1,
          filename: filename1,
          contentType: contentType1,
        });
        if (!("uploadUrl" in requestResult && "object" in requestResult)) {
          fail("Expected requestUploadUrl success for report");
        }

        const successRequestResult = requestResult as {
          uploadUrl: string;
          bucket: string;
          object: string;
        };
        objectPath1 = successRequestResult.object;
        console.log(
          `User 1 obtained upload URL for '${filename1}': ${successRequestResult.uploadUrl}, Object: ${objectPath1}`,
        );
      },
    );

    // (Simulate actual upload to GCS using successRequestResult.uploadUrl - this part is external to the concept)

    await t.step(
      "Step 2 (User 1): Confirm the upload of the report",
      async () => {
        const confirmResult = await fileConcept.confirmUpload({
          user: TEST_USER_ID_1,
          object: objectPath1,
          contentType: contentType1,
          size: size1,
        });
        if (!("file" in confirmResult && "url" in confirmResult)) {
          fail("Expected confirmUpload success for report");
        }

        const successConfirmResult = confirmResult as { file: ID; url: string };
        uploadedFileId1 = successConfirmResult.file;
        console.log(
          `User 1 confirmed upload of '${filename1}'. File ID: ${uploadedFileId1}, Public URL: ${successConfirmResult.url}`,
        );

        // Verify DB entry for the report
        const { file: storedFile } = await fileConcept._getFileById({
          file: uploadedFileId1,
        });
        assertExists(
          storedFile,
          "Report file document must exist in DB after confirmation",
        );
        assertEquals(
          storedFile?.owner,
          TEST_USER_ID_1,
          "Report file owner should be User 1",
        );
        assertEquals(
          storedFile?.object,
          objectPath1,
          "Report file object path should match",
        );
        assertEquals(
          storedFile?.contentType,
          contentType1,
          "Report file content type should match",
        );
        assertEquals(storedFile?.size, size1, "Report file size should match");
        console.log(
          "Principle fulfilled: Verified report file metadata in database.",
        );
      },
    );

    // --- User 2 Upload Process ---
    await t.step(
      "Step 3 (User 2): Request an upload URL for a profile picture",
      async () => {
        const requestResult = await fileConcept.requestUploadUrl({
          user: TEST_USER_ID_2,
          filename: filename2,
          contentType: contentType2,
        });
        if (!("uploadUrl" in requestResult && "object" in requestResult)) {
          fail("Expected requestUploadUrl success for profile picture");
        }

        const successRequestResult = requestResult as {
          uploadUrl: string;
          bucket: string;
          object: string;
        };
        objectPath2 = successRequestResult.object;
        console.log(
          `User 2 obtained upload URL for '${filename2}': ${successRequestResult.uploadUrl}, Object: ${objectPath2}`,
        );
      },
    );

    // (Simulate actual upload to GCS using successRequestResult.uploadUrl)

    await t.step(
      "Step 4 (User 2): Confirm the upload of the profile picture",
      async () => {
        const confirmResult = await fileConcept.confirmUpload({
          user: TEST_USER_ID_2,
          object: objectPath2,
          contentType: contentType2,
          size: size2,
        });
        if (!("file" in confirmResult && "url" in confirmResult)) {
          fail("Expected confirmUpload success for profile picture");
        }

        const successConfirmResult = confirmResult as { file: ID; url: string };
        uploadedFileId2 = successConfirmResult.file;
        console.log(
          `User 2 confirmed upload of '${filename2}'. File ID: ${uploadedFileId2}, Public URL: ${successConfirmResult.url}`,
        );

        // Verify DB entry for the profile picture
        const { file: storedFile } = await fileConcept._getFileById({
          file: uploadedFileId2,
        });
        assertExists(
          storedFile,
          "Profile pic file document must exist in DB after confirmation",
        );
        assertEquals(
          storedFile?.owner,
          TEST_USER_ID_2,
          "Profile pic file owner should be User 2",
        );
        assertEquals(
          storedFile?.object,
          objectPath2,
          "Profile pic file object path should match",
        );
        assertEquals(
          storedFile?.contentType,
          contentType2,
          "Profile pic file content type should match",
        );
        assertEquals(
          storedFile?.size,
          size2,
          "Profile pic file size should match",
        );
        console.log(
          "Principle fulfilled: Verified profile picture file metadata in database.",
        );
      },
    );

    // --- User 1 View Process ---
    await t.step(
      "Step 5 (User 1): Request a view URL for their uploaded report",
      async () => {
        const viewResult = await fileConcept.getViewUrl({
          user: TEST_USER_ID_1,
          object: objectPath1,
        });
        if (!("url" in viewResult)) {
          fail("Expected getViewUrl success for report");
        }
        assertEquals(
          (viewResult as { url: string }).url,
          mockSignedUrl,
          "View URL should be the mocked signed URL",
        );
        console.log(
          `User 1 obtained view URL for '${filename1}': ${
            (viewResult as { url: string }).url
          }`,
        );

        // Verify that the signer was called with GET method for viewing the report
        const getCall = calls.find((call) =>
          call.method === "GET" && call.object === objectPath1
        );
        assertExists(
          getCall,
          "signer should have been called for GET request of report",
        );
        assertObjectMatch(getCall, {
          method: "GET",
          bucket: TEST_BUCKET,
          object: objectPath1,
          expiresInSeconds: 300, // Default expiresInSeconds
        }, "GET signed URL parameters for report are correct");
        console.log(
          "Principle fulfilled: Verified generateV4SignedUrl was called with GET for report.",
        );
      },
    );

    // --- Querying Files ---
    await t.step("Step 6: User 1 queries their own files", async () => {
      const { files } = await fileConcept._getFilesByOwner({
        user: TEST_USER_ID_1,
      });
      assertEquals(files.length, 1, "User 1 should have 1 file");
      assertEquals(
        files[0]._id,
        uploadedFileId1,
        "User 1's file ID should match the uploaded report",
      );
      assertEquals(
        files[0].owner,
        TEST_USER_ID_1,
        "User 1's file owner should be User 1",
      );
      console.log(
        `Principle fulfilled: User 1 files found: ${
          files.map((f) => f.object).join(", ")
        }`,
      );
    });

    await t.step("Step 7: User 2 queries their own files", async () => {
      const { files } = await fileConcept._getFilesByOwner({
        user: TEST_USER_ID_2,
      });
      assertEquals(files.length, 1, "User 2 should have 1 file");
      assertEquals(
        files[0]._id,
        uploadedFileId2,
        "User 2's file ID should match the uploaded profile picture",
      );
      assertEquals(
        files[0].owner,
        TEST_USER_ID_2,
        "User 2's file owner should be User 2",
      );
      console.log(
        `Principle fulfilled: User 2 files found: ${
          files.map((f) => f.object).join(", ")
        }`,
      );
    });

    await t.step("Step 8: Query a user with no files", async () => {
      const { files } = await fileConcept._getFilesByOwner({
        user: "nonexistent-user-id" as ID,
      });
      assertEquals(files.length, 0, "Nonexistent user should have no files");
      console.log(
        "Principle fulfilled: Nonexistent user has no files, as expected.",
      );
    });
  });

  // No restore needed with dependency injection
  await client.close();
});
