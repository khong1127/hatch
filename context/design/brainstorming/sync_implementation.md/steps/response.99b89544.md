---
timestamp: 'Thu Nov 06 2025 09:35:36 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_093536.a6c8a8d1.md]]'
content_id: 99b8954478882edec147c693f58cb66f5a35884efe48cafde739bf6df5303370
---

# response:

Of course. Based on your goals, here are the synchronization functions for the `SessionLogging` concept.

These syncs enforce that a user must be authenticated (via the `Sessioning` concept) to perform any action related to birding sessions. For actions that modify or query a *specific* birding session, an additional authorization check ensures the authenticated user is the owner of that session.

I've created a new file, `src/syncs/sessionlogging.sync.ts`, to house these synchronizations.

### `src/syncs/sessionlogging.sync.ts`

```typescript
import { actions, Sync } from "@engine";
import { Requesting, Sessioning, SessionLogging } from "@concepts";

// =============================================================================
// Start Session (Birding Trip)
// =============================================================================

/**
 * When a user requests to start a birding session, this sync first verifies
 * they are authenticated via their session token, then triggers the
 * SessionLogging.startSession action with their user ID.
 */
export const StartBirdingSessionRequest: Sync = (
  { request, sessionToken, user, location, notes },
) => ({
  when: actions([
    Requesting.request,
    { path: "/SessionLogging/startSession", sessionToken, location, notes },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate the user. If the sessionToken is invalid, this query returns no frames, and the sync stops.
    return await frames.query(Sessioning._getUser, { session: sessionToken }, {
      user,
    });
  },
  then: actions([SessionLogging.startSession, { user, location, notes }]),
});

/**
 * When a birding session is successfully created, this sync responds to the
 * original request with the new session's details.
 */
export const StartBirdingSessionResponseSuccess: Sync = (
  { request, birdingSession },
) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/startSession" }, { request }],
    [SessionLogging.startSession, {}, { birdingSession }], // Match on successful output
  ),
  then: actions([Requesting.respond, { request, birdingSession }]),
});

/**
 * If creating a birding session fails, this sync responds to the original
 * request with the error message.
 */
export const StartBirdingSessionResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/startSession" }, { request }],
    [SessionLogging.startSession, {}, { error }], // Match on error output
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
// Add Entry to Session
// =============================================================================

/**
 * When a user requests to add an entry to a birding session, this sync
 * authenticates the user and authorizes that they are the owner of the
 * session before triggering the SessionLogging.addEntry action.
 */
export const AddBirdingEntryRequest: Sync = (
  { request, sessionToken, user, sessionDetails, sessionId, species, count, notes },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/SessionLogging/addEntry",
      sessionToken,
      sessionId,
      species,
      count,
      notes,
    },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate the user
    frames = await frames.query(Sessioning._getUser, { session: sessionToken }, {
      user,
    });
    // 2. Fetch the details of the birding session they want to modify
    frames = await frames.query(
      SessionLogging._getSessionDetails,
      { sessionId },
      { sessionDetails },
    );
    // 3. Authorize: ensure the authenticated user owns the session. If not, the frame is removed.
    return frames.filter(($) => $[sessionDetails]?.user === $[user]);
  },
  then: actions([
    SessionLogging.addEntry,
    { sessionId, species, count, notes },
  ]),
});

/**
 * Responds with the new entry on success.
 */
export const AddBirdingEntryResponseSuccess: Sync = ({ request, entry }) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/addEntry" }, { request }],
    [SessionLogging.addEntry, {}, { entry }],
  ),
  then: actions([Requesting.respond, { request, entry }]),
});

/**
 * Responds with an error if adding an entry fails.
 */
export const AddBirdingEntryResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/addEntry" }, { request }],
    [SessionLogging.addEntry, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
// End Session
// =============================================================================

/**
 * When a user requests to end a birding session, this sync verifies they are
 * authenticated and own the session before triggering the SessionLogging.endSession action.
 */
export const EndBirdingSessionRequest: Sync = (
  { request, sessionToken, user, sessionDetails, sessionId, endTime },
) => ({
  when: actions([
    Requesting.request,
    { path: "/SessionLogging/endSession", sessionToken, sessionId, endTime },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate
    frames = await frames.query(Sessioning._getUser, { session: sessionToken }, {
      user,
    });
    // 2. Fetch session details for authorization
    frames = await frames.query(
      SessionLogging._getSessionDetails,
      { sessionId },
      { sessionDetails },
    );
    // 3. Authorize
    return frames.filter(($) => $[sessionDetails]?.user === $[user]);
  },
  then: actions([SessionLogging.endSession, { sessionId, endTime }]),
});

/**
 * Responds with a success status if the session is ended successfully.
 */
export const EndBirdingSessionResponseSuccess: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/endSession" }, { request }],
    [SessionLogging.endSession, {}, {}], // Success is an empty object
  ),
  then: actions([Requesting.respond, { request, status: "ok" }]),
});

/**
 * Responds with an error if ending the session fails.
 */
export const EndBirdingSessionResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/endSession" }, { request }],
    [SessionLogging.endSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
// Queries
// =============================================================================

/**
 * Gets all birding sessions for the currently authenticated user.
 */
export const GetMyBirdingSessionsRequest: Sync = (
  { request, sessionToken, user, sessions },
) => ({
  when: actions([
    Requesting.request,
    { path: "/SessionLogging/_getSessionsByUser", sessionToken },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate
    frames = await frames.query(Sessioning._getUser, { session: sessionToken }, {
      user,
    });
    // 2. Query for the sessions using the authenticated user ID
    return await frames.query(
      SessionLogging._getSessionsByUser,
      { user },
      { sessions },
    );
  },
  then: actions([Requesting.respond, { request, sessions }]),
});

/**
 * Gets the details for a specific birding session, but only if the
 * authenticated user is the owner of that session.
 */
export const GetBirdingSessionDetailsRequest: Sync = (
  { request, sessionToken, user, sessionId, sessionDetails },
) => ({
  when: actions([
    Requesting.request,
    { path: "/SessionLogging/_getSessionDetails", sessionToken, sessionId },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate
    frames = await frames.query(Sessioning._getUser, { session: sessionToken }, {
      user,
    });
    // 2. Fetch session details
    frames = await frames.query(
      SessionLogging._getSessionDetails,
      { sessionId },
      { sessionDetails },
    );
    // 3. Authorize and return ONLY if the user is the owner
    return frames.filter(($) => $[sessionDetails]?.user === $[user]);
  },
  then: actions([Requesting.respond, { request, sessionDetails }]),
});

/**
 * Gets all entries for a specific birding session, but only if the
 * authenticated user is the owner of that session.
 */
export const GetBirdingEntriesInSessionRequest: Sync = (
  { request, sessionToken, user, sessionId, sessionDetails, entries },
) => ({
  when: actions([
    Requesting.request,
    { path: "/SessionLogging/_getEntriesInSession", sessionToken, sessionId },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate
    frames = await frames.query(Sessioning._getUser, { session: sessionToken }, {
      user,
    });
    // 2. Fetch session details for authorization
    frames = await frames.query(
      SessionLogging._getSessionDetails,
      { sessionId },
      { sessionDetails },
    );
    // 3. Authorize by filtering
    frames = frames.filter(($) => $[sessionDetails]?.user === $[user]);
    // 4. If authorized, query for the entries
    return await frames.query(
      SessionLogging._getEntriesInSession,
      { sessionId },
      { entries },
    );
  },
  then: actions([Requesting.respond, { request, entries }]),
});

/**
 * Checks if a specific birding session is active, but only if the
 * authenticated user is the owner of that session.
 */
export const IsBirdingSessionActiveRequest: Sync = (
  { request, sessionToken, user, sessionId, sessionDetails, isActive },
) => ({
  when: actions([
    Requesting.request,
    { path: "/SessionLogging/_isSessionActive", sessionToken, sessionId },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate
    frames = await frames.query(Sessioning._getUser, { session: sessionToken }, {
      user,
    });
    // 2. Fetch session details for authorization
    frames = await frames.query(
      SessionLogging._getSessionDetails,
      { sessionId },
      { sessionDetails },
    );
    // 3. Authorize by filtering
    frames = frames.filter(($) => $[sessionDetails]?.user === $[user]);
    // 4. If authorized, query for the active status
    return await frames.query(
      SessionLogging._isSessionActive,
      { sessionId },
      { isActive },
    );
  },
  then: actions([Requesting.respond, { request, isActive }]),
});
```
