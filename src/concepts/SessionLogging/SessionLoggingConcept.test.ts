import {
  assertEquals,
  assertExists,
  assertNotEquals as _assertNotEquals,
} from "@std/assert";
import { freshID as _freshID, testDb } from "../../utils/database.ts"; // Adjust path as needed for your project structure
import { Empty as _Empty, ID } from "../../utils/types.ts"; // Adjust path as needed for your project structure
import SessionLoggingConcept from "./SessionLoggingConcept.ts";

// Helper for checking if a result is an error object
function isError(result: unknown): result is { error: string } {
  return !!result && typeof result === "object" && "error" in result;
}

// Utility to print action and result for better test trace readability
const logAction = (actionName: string, inputs: unknown, result: unknown) => {
  console.log(`\n--- Action: ${actionName} ---`);
  console.log("  Inputs:", inputs);
  console.log("  Result:", result);
};

Deno.test("SessionLogging Concept Tests", async (t) => {
  // Initialize a new database connection for this test file
  // The database will be dropped before this Deno.test block starts.
  const [db, client] = await testDb();
  const concept = new SessionLoggingConcept(db);

  // Mock User and Image IDs using type branding
  const userAlice = "user:Alice" as ID;
  const userBob = "user:Bob" as ID;
  // Images now represented as URL strings
  const image1 = "https://example.com/images/photo1.jpg";
  const image2 = "https://example.com/images/photo2.png";
  const image3 = "https://example.com/images/photo3.jpeg";
  const image4 = "https://example.com/images/photo4.jpg";
  const image5 = "https://example.com/images/photo5.jpeg";

  // # trace: Operational Principle - Start, Add, End Session, and Verify Persistence
  await t.step(
    "Principle Trace: Fulfilling the concept's main purpose",
    async () => {
      console.log("\n--- EXECUTING Principle Trace ---");

      // 1. User Alice starts a session
      console.log("Scenario: Alice starts a new session.");
      const startSessionResult = await concept.startSession({
        user: userAlice,
      });
      logAction("startSession", { user: userAlice }, startSessionResult);
      assertEquals(
        isError(startSessionResult),
        false,
        `Expected no error, got: ${
          isError(startSessionResult)
            ? startSessionResult.error
            : "Unknown error"
        }`,
      );
      const sessionAlice1 = (startSessionResult as { session: ID }).session;
      assertExists(sessionAlice1, "Session ID should be returned.");

      // Verify initial state of the session
      let sessionDetails = await concept._getSessionDetails({
        session: sessionAlice1,
      });
      assertExists(
        sessionDetails,
        "Session details array should be retrievable.",
      );
      assertEquals(
        sessionDetails.length,
        1,
        "Should return exactly one session detail.",
      );
      assertEquals(
        sessionDetails[0]?.owner, // Access first element
        userAlice,
        "Session owner should be Alice.",
      );
      assertEquals(
        sessionDetails[0]?.active, // Access first element
        true,
        "Session should be active upon creation.",
      );
      assertEquals(
        sessionDetails[0]?.images.length, // Access first element
        0,
        "Session should start with no images.",
      );
      const aliceSessions = await concept._getSessionsByUser({
        user: userAlice,
      });
      assertEquals(
        aliceSessions.includes(sessionAlice1),
        true,
        "Alice should own the new session.",
      );

      // 2. Alice adds multiple image entries to the session
      console.log(
        "\nScenario: Alice adds multiple image entries to the active session.",
      );
      await concept.addEntry({
        user: userAlice,
        session: sessionAlice1,
        image: image1,
      });
      await concept.addEntry({
        user: userAlice,
        session: sessionAlice1,
        image: image2,
      });
      await concept.addEntry({
        user: userAlice,
        session: sessionAlice1,
        image: image3,
      });
      logAction("addEntry (multiple)", {
        user: userAlice,
        session: sessionAlice1,
        images: [image1, image2, image3],
      }, {});

      // Verify images are logged
      let sessionImages = await concept._getEntriesInSession({
        session: sessionAlice1,
      });
      assertEquals(
        sessionImages.length,
        3,
        "Session should have 3 images after adding.",
      );
      assertEquals(
        sessionImages.includes(image1),
        true,
        "Session should contain image1.",
      );
      assertEquals(
        sessionImages.includes(image2),
        true,
        "Session should contain image2.",
      );
      assertEquals(
        sessionImages.includes(image3),
        true,
        "Session should contain image3.",
      );

      // 3. Alice ends the session
      console.log("\nScenario: Alice ends the session.");
      const endSessionResult = await concept.endSession({
        user: userAlice,
        session: sessionAlice1,
      });
      logAction(
        "endSession",
        { user: userAlice, session: sessionAlice1 },
        endSessionResult,
      );
      assertEquals(
        isError(endSessionResult),
        false,
        `Expected no error, got: ${
          isError(endSessionResult) ? endSessionResult.error : "Unknown error"
        }`,
      );

      // Verify session is inactive
      sessionDetails = await concept._getSessionDetails({
        session: sessionAlice1,
      });
      assertEquals(
        sessionDetails.length,
        1,
        "Should return exactly one session detail after ending.",
      );
      assertEquals(
        sessionDetails[0]?.active, // Access first element
        false,
        "Session should be inactive after ending.",
      );
      const isActiveQueryResult = await concept._isSessionActive({
        session: sessionAlice1,
      });
      assertEquals(
        isActiveQueryResult.length,
        1,
        "Should return exactly one boolean for active status.",
      );
      assertEquals(
        isActiveQueryResult[0], // Access first element
        false,
        "Query for active status should confirm inactive.",
      );

      console.log(
        "\nScenario: Verify recorded entries persist after the session ends.",
      );
      sessionImages = await concept._getEntriesInSession({
        session: sessionAlice1,
      });
      assertEquals(
        sessionImages.length,
        3,
        "Entries should persist after session ends.",
      );
      assertEquals(sessionImages.includes(image1), true);
      assertEquals(sessionImages.includes(image2), true);
      assertEquals(sessionImages.includes(image3), true);

      console.log(
        `Images from Alice's session: `,
        sessionImages,
      );
    },
  );

  await t.step("Scenario: `addEntry` Precondition Violations", async () => {
    console.log("\n--- EXECUTING addEntry Precondition Violation Tests ---");

    // Setup an active session for Alice for valid base cases
    const startSessionResult = await concept.startSession({ user: userAlice });
    const sessionAlice2 = (startSessionResult as { session: ID }).session;
    console.log(`Setup: Started session ${sessionAlice2} for Alice.`);

    // 1. Attempt to add entry to a non-existent session
    console.log("Scenario: Adding entry to a non-existent session.");
    const nonExistentSession = "session:nonExistent" as ID;
    const addEntryNonExistentResult = await concept.addEntry({
      user: userAlice,
      session: nonExistentSession,
      image: image1,
    });
    logAction("addEntry (non-existent session)", {
      user: userAlice,
      session: nonExistentSession,
      image: image1,
    }, addEntryNonExistentResult);
    assertEquals(
      isError(addEntryNonExistentResult),
      true,
      "Adding entry to non-existent session should fail.",
    );
    assertEquals(
      (addEntryNonExistentResult as { error: string }).error,
      `SessionLogging: Session with ID ${nonExistentSession} not found.`,
    );

    // 2. Attempt to add entry to a session owned by another user
    console.log("Scenario: Alice tries to add entry to Bob's session.");
    const startSessionBobResult = await concept.startSession({ user: userBob });
    const sessionBob1 = (startSessionBobResult as { session: ID }).session;
    console.log(`Setup: Started session ${sessionBob1} for Bob.`);

    const addEntryWrongOwnerResult = await concept.addEntry({
      user: userAlice,
      session: sessionBob1,
      image: image1,
    });
    logAction("addEntry (wrong owner)", {
      user: userAlice,
      session: sessionBob1,
      image: image1,
    }, addEntryWrongOwnerResult);
    assertEquals(
      isError(addEntryWrongOwnerResult),
      true,
      "Adding entry to another user's session should fail.",
    );
    assertEquals(
      (addEntryWrongOwnerResult as { error: string }).error,
      `SessionLogging: User ${userAlice} is not the owner of session ${sessionBob1}.`,
    );

    // 3. Attempt to add the same image twice to an active session
    console.log("Scenario: Alice adds the same image twice to her session.");
    await concept.addEntry({
      user: userAlice,
      session: sessionAlice2,
      image: image4,
    }); // Add it once
    logAction("addEntry (first time image4)", {
      user: userAlice,
      session: sessionAlice2,
      image: image4,
    }, {});

    let sessionImages = await concept._getEntriesInSession({
      session: sessionAlice2,
    });
    assertEquals(
      sessionImages.includes(image4),
      true,
      "Image4 should be present after first add.",
    );
    assertEquals(
      sessionImages.length,
      1,
      "Session should have 1 image initially.",
    );

    const addEntryDuplicateResult = await concept.addEntry({
      user: userAlice,
      session: sessionAlice2,
      image: image4,
    }); // Add it again
    logAction("addEntry (duplicate image4)", {
      user: userAlice,
      session: sessionAlice2,
      image: image4,
    }, addEntryDuplicateResult);
    assertEquals(
      isError(addEntryDuplicateResult),
      true,
      "Adding duplicate image should fail.",
    );
    assertEquals(
      (addEntryDuplicateResult as { error: string }).error,
      `SessionLogging: Image ${image4} is already an entry in session ${sessionAlice2}.`,
    );

    sessionImages = await concept._getEntriesInSession({
      session: sessionAlice2,
    });
    assertEquals(
      sessionImages.length,
      1,
      "Image count should still be 1 after duplicate attempt.",
    );

    // Alice ends session
    console.log("\nScenario: Alice ends the session.");
    const endSessionResult = await concept.endSession({
      user: userAlice,
      session: sessionAlice2,
    });
    logAction(
      "endSession",
      { user: userAlice, session: sessionAlice2 },
      endSessionResult,
    );
    assertEquals(
      isError(endSessionResult),
      false,
      `Expected no error, got: ${
        isError(endSessionResult) ? endSessionResult.error : "Unknown error"
      }`,
    );

    // 4. Attempt to add an entry to the ended session (should fail)
    console.log(
      "\nScenario: Attempt to add an entry to an already ended session (expected to fail).",
    );
    const addEntryFailedResult = await concept.addEntry({
      user: userAlice,
      session: sessionAlice2,
      image: image5,
    });
    logAction("addEntry (to ended session)", {
      user: userAlice,
      session: sessionAlice2,
      image: image5,
    }, addEntryFailedResult);
    assertEquals(
      isError(addEntryFailedResult),
      true,
      "Adding entry to inactive session should fail.",
    );
    assertEquals(
      (addEntryFailedResult as { error: string }).error,
      `SessionLogging: Session with ID ${sessionAlice2} is not active. Cannot add entries.`,
    );
    sessionImages = await concept._getEntriesInSession({
      session: sessionAlice2,
    });
    assertEquals(
      sessionImages.includes(image5),
      false,
      "image5 should not be added to inactive session.",
    );

    // 5. Verify previously recorded entries are still associated (persistence as per principle)
    console.log(
      "Scenario: Verify recorded entries persist after the session ends.",
    );
    sessionImages = await concept._getEntriesInSession({
      session: sessionAlice2,
    });
    assertEquals(
      sessionImages.length,
      1,
      "Entries should persist after session ends.",
    );
    assertEquals(sessionImages.includes(image4), true);
    console.log(
      `Images from Alice's session: `,
      sessionImages,
    );
  });

  await t.step(
    "Scenario: `endSession` Precondition Violations and Idempotency",
    async () => {
      console.log(
        "\n--- EXECUTING endSession Precondition Violation & Idempotency Tests ---",
      );

      // Setup an active session for Alice
      const startSessionResult = await concept.startSession({
        user: userAlice,
      });
      const sessionAlice3 = (startSessionResult as { session: ID }).session;
      console.log(`Setup: Started session ${sessionAlice3} for Alice.`);

      // 1. Attempt to end a non-existent session
      console.log("Scenario: Ending a non-existent session.");
      const nonExistentSession = "session:anotherNonExistent" as ID;
      const endSessionNonExistentResult = await concept.endSession({
        user: userAlice,
        session: nonExistentSession,
      });
      logAction("endSession (non-existent session)", {
        user: userAlice,
        session: nonExistentSession,
      }, endSessionNonExistentResult);
      assertEquals(
        isError(endSessionNonExistentResult),
        true,
        "Ending non-existent session should fail.",
      );
      assertEquals(
        (endSessionNonExistentResult as { error: string }).error,
        `SessionLogging: Session with ID ${nonExistentSession} not found.`,
      );

      // 2. Attempt to end a session owned by another user
      console.log("Scenario: Alice tries to end Bob's session.");
      const startSessionBobResult = await concept.startSession({
        user: userBob,
      });
      const sessionBob2 = (startSessionBobResult as { session: ID }).session;
      console.log(`Setup: Started session ${sessionBob2} for Bob.`);

      const endSessionWrongOwnerResult = await concept.endSession({
        user: userAlice,
        session: sessionBob2,
      });
      logAction("endSession (wrong owner)", {
        user: userAlice,
        session: sessionBob2,
      }, endSessionWrongOwnerResult);
      assertEquals(
        isError(endSessionWrongOwnerResult),
        true,
        "Ending another user's session should fail.",
      );
      assertEquals(
        (endSessionWrongOwnerResult as { error: string }).error,
        `SessionLogging: User ${userAlice} is not the owner of session ${sessionBob2}.`,
      );

      // 3. Attempt to end an already ended session (now expected to fail based on 'requires' clause)
      console.log("Scenario: Ending an already inactive session.");
      await concept.endSession({ user: userAlice, session: sessionAlice3 }); // End it once
      logAction("endSession (first time)", {
        user: userAlice,
        session: sessionAlice3,
      }, {});
      let sessionActiveStatusArray = await concept._isSessionActive({ // Renamed to avoid confusion with single boolean
        session: sessionAlice3,
      });
      assertEquals(
        sessionActiveStatusArray.length,
        1,
        "Should return exactly one boolean for active status.",
      );
      assertEquals(
        sessionActiveStatusArray[0], // Access first element
        false,
        "Session should be inactive after first end call.",
      );

      const endSessionAgainResult = await concept.endSession({
        user: userAlice,
        session: sessionAlice3,
      }); // End it again
      logAction("endSession (second time - expected error)", {
        user: userAlice,
        session: sessionAlice3,
      }, endSessionAgainResult);
      assertEquals(
        isError(endSessionAgainResult),
        true,
        "Ending an already inactive session should now return an error as per 'requires' clause.",
      );
      assertEquals(
        (endSessionAgainResult as { error: string }).error,
        `SessionLogging: Session with ID ${sessionAlice3} is already inactive.`, // Assert specific error message
        "Expected specific error message for inactive session.",
      );

      sessionActiveStatusArray = await concept._isSessionActive({ // Renamed
        session: sessionAlice3,
      });
      assertEquals(
        sessionActiveStatusArray.length,
        1,
        "Should still return one boolean for active status.",
      );
      assertEquals(
        sessionActiveStatusArray[0], // Access first element
        false,
        "Session should still be inactive after failed second end call.", // Updated message
      );
    },
  );

  await t.step(
    "Scenario: Multiple Users, Isolation, and Cross-User Interaction",
    async () => {
      console.log("\n--- EXECUTING Multi-User Isolation Tests ---");

      // Alice starts a session and adds entries
      console.log("Scenario: Alice starts her session and adds images.");
      const startAliceSessionResult = await concept.startSession({
        user: userAlice,
      });
      const sessionAlice4 =
        (startAliceSessionResult as { session: ID }).session;
      await concept.addEntry({
        user: userAlice,
        session: sessionAlice4,
        image: image1,
      });
      await concept.addEntry({
        user: userAlice,
        session: sessionAlice4,
        image: image2,
      });
      logAction("Alice's actions", {
        session: sessionAlice4,
        images: [image1, image2],
      }, {});

      // Bob starts a separate session and adds entries
      console.log("Scenario: Bob starts his session and adds images.");
      const startBobSessionResult = await concept.startSession({
        user: userBob,
      });
      const sessionBob3 = (startBobSessionResult as { session: ID }).session;
      await concept.addEntry({
        user: userBob,
        session: sessionBob3,
        image: image3,
      });
      await concept.addEntry({
        user: userBob,
        session: sessionBob3,
        image: image5,
      });
      logAction("Bob's actions", {
        session: sessionBob3,
        images: [image3, image5],
      }, {});

      // Verify each user's sessions/entries are isolated
      console.log("Scenario: Verifying isolation of sessions between users.");
      // Alice has had sessions created in previous steps too
      const aliceSessions = await concept._getSessionsByUser({
        user: userAlice,
      });
      assertEquals(
        aliceSessions.length,
        4,
        "Alice should have 4 sessions across all test steps.",
      ); // sessionAlice1, sessionAlice2, sessionAlice3, sessionAlice4
      assertEquals(
        aliceSessions.includes(sessionAlice4),
        true,
        "Alice should own sessionAlice4.",
      );
      const aliceImages = await concept._getEntriesInSession({
        session: sessionAlice4,
      });
      assertEquals(
        aliceImages.length,
        2,
        "Alice's sessionAlice4 should have 2 images.",
      );
      assertEquals(aliceImages.includes(image1), true);
      assertEquals(aliceImages.includes(image2), true);
      assertEquals(
        aliceImages.includes(image3),
        false,
        "Alice's session should not contain Bob's image3.",
      );
      assertEquals(
        aliceImages.includes(image5),
        false,
        "Alice's session should not contain Bob's image5.",
      );
      console.log(
        `Alice's session includes image1? --> ${
          aliceImages.includes(image1)
        }. Expected: True`,
      );
      console.log(
        `Alice's session includes image2? --> ${
          aliceImages.includes(image2)
        }. Expected: True`,
      );
      console.log(
        `Alice's session includes image3? --> ${
          aliceImages.includes(image3)
        }. Expected: False`,
      );
      console.log(
        `Alice's session includes image5? --> ${
          aliceImages.includes(image5)
        }. Expected: False`,
      );

      const bobSessions = await concept._getSessionsByUser({ user: userBob });
      assertEquals(
        bobSessions.length,
        3,
        "Bob should have 3 sessions across all test steps.",
      ); // sessionBob1, sessionBob2, sessionBob3
      assertEquals(
        bobSessions.includes(sessionBob3),
        true,
        "Bob should own sessionBob3.",
      );
      const bobImages = await concept._getEntriesInSession({
        session: sessionBob3,
      });
      assertEquals(
        bobImages.length,
        2,
        "Bob's sessionBob3 should have 2 images.",
      );
      assertEquals(bobImages.includes(image3), true);
      assertEquals(bobImages.includes(image5), true);
      assertEquals(
        bobImages.includes(image1),
        false,
        "Bob's session should not contain Alice's image1.",
      );
      assertEquals(
        bobImages.includes(image2),
        false,
        "Bob's session should not contain Alice's image2.",
      );
      console.log(
        `Bob's session includes image1? --> ${
          bobImages.includes(image1)
        }. Expected: False`,
      );
      console.log(
        `Bob's session includes image2? --> ${
          bobImages.includes(image2)
        }. Expected: False`,
      );
      console.log(
        `Bob's session includes image3? --> ${
          bobImages.includes(image3)
        }. Expected: True`,
      );
      console.log(
        `Bob's session includes image5? --> ${
          bobImages.includes(image5)
        }. Expected: True`,
      );

      // User Alice tries to mess with User Bob's session (should fail)
      console.log(
        "Scenario: Alice attempts unauthorized actions on Bob's session.",
      );
      const aliceAddBobSessionResult = await concept.addEntry({
        user: userAlice,
        session: sessionBob3,
        image: image4,
      });
      logAction("Alice add entry to Bob's session", {
        user: userAlice,
        session: sessionBob3,
        image: image4,
      }, aliceAddBobSessionResult);
      assertEquals(
        isError(aliceAddBobSessionResult),
        true,
        "Alice should not be able to add to Bob's session.",
      );
      assertEquals(
        (aliceAddBobSessionResult as { error: string }).error,
        `SessionLogging: User ${userAlice} is not the owner of session ${sessionBob3}.`,
      );

      const aliceEndBobSessionResult = await concept.endSession({
        user: userAlice,
        session: sessionBob3,
      });
      logAction("Alice end Bob's session", {
        user: userAlice,
        session: sessionBob3,
      }, aliceEndBobSessionResult);
      assertEquals(
        isError(aliceEndBobSessionResult),
        true,
        "Alice should not be able to end Bob's session.",
      );
      assertEquals(
        (aliceEndBobSessionResult as { error: string }).error,
        `SessionLogging: User ${userAlice} is not the owner of session ${sessionBob3}.`,
      );

      // Verify Bob's session is still active and unmodified after Alice's attempts
      const bobSessionActiveStatusArray = await concept._isSessionActive({
        session: sessionBob3,
      });
      assertEquals(
        bobSessionActiveStatusArray.length,
        1,
        "Should return one boolean for Bob's session active status.",
      );
      assertEquals(
        bobSessionActiveStatusArray[0], // Access first element
        true,
        "Bob's session should still be active.",
      );
      assertEquals(
        (await concept._getEntriesInSession({ session: sessionBob3 })).length,
        2,
        "Bob's session entries should be unchanged.",
      );
    },
  );

  // Close the database client after all tests in this file are complete
  await client.close();
});
