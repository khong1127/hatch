---
timestamp: 'Thu Nov 06 2025 10:11:24 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_101124.06c57f66.md]]'
content_id: 53dbe767d665c3b5a9ee3159c1c2dd332b41c12b26178822ea441a3b0272d8bb
---

# file: src/syncs/hatch.syncs.ts

```typescript
import { actions, Sync } from "@engine";
import type { ID } from "@utils/types.ts";
import {
  Commenting,
  File,
  Friending,
  PasswordAuthentication,
  Posting,
  Requesting,
  SessionLogging,
} from "@concepts";

/**
 * When a request to add a comment is made, verify the user is logged in,
 * the post exists, and the user has permission to view the post before adding the comment.
 */
export const AddCommentRequest: Sync = (
  { request, session, content, post, user, postDoc },
) => ({
  when: actions([Requesting.request, {
    path: "/Commenting/addComment",
    session,
    content,
    post,
  }, { request }]),
  where: async (frames) => {
    // 1. Authenticate user -> map session -> user (owner)
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    if (frames.length === 0) return frames; // Stop if not authenticated

    // 2. Verify post exists (adapt concept return shape)
    frames = await frames.query(Posting._getPostByIdForSync, { post }, {
      postDoc,
    });
    if (frames.length === 0) return frames; // Stop if post doesn't exist

    // 3. Authorize: user can see the post if they are the author OR are friends with the author
    const keep: boolean[] = [];
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const postAuthorVal =
        (frame as Record<symbol, unknown>)[postDoc] as unknown;
      const currentUser = (frame as Record<symbol, unknown>)[user];

      if (postAuthorVal === currentUser) {
        keep[i] = true;
        continue;
      }

      // postAuthorVal may be a full post document or an author id; handle both
      let postAuthorId: unknown;
      if (
        postAuthorVal && typeof postAuthorVal === "object" &&
        "author" in (postAuthorVal as Record<string, unknown>)
      ) {
        postAuthorId = (postAuthorVal as Record<string, unknown>).author;
      } else {
        postAuthorId = postAuthorVal;
      }

      const friendCheck = await Friending._isFriends({
        user1: currentUser as unknown as ID,
        user2: postAuthorId as unknown as ID,
      });
      keep[i] = !!(friendCheck.areFriends && friendCheck.areFriends[0]);
    }
    return frames.filter((_, idx) => !!keep[idx]);
  },
  then: actions([Commenting.addComment, { author: user, content, post }]),
});

export const AddCommentResponse: Sync = ({ request, comment }) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/addComment" }, { request }],
    [Commenting.addComment, {}, { comment }],
  ),
  then: actions([Requesting.respond, { request, comment }]),
});

export const AddCommentResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/addComment" }, { request }],
    [Commenting.addComment, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * When a request to delete a comment is made, verify the user is logged in
 * and is the author of the comment before deleting it.
 */
export const DeleteCommentRequest: Sync = (
  { request, session, comment, user, commentDoc },
) => ({
  when: actions([Requesting.request, {
    path: "/Commenting/deleteComment",
    session,
    comment,
  }, { request }]),
  where: async (frames) => {
    // 1. Authenticate user -> map session -> user (owner)
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    if (frames.length === 0) return frames;

    // 2. Get the comment to check its author (adapt concept return shape)
    frames = await frames.query(Commenting._getCommentForSync, { comment }, {
      commentDoc,
    });

    // 3. Authorize: only the author can delete
    return frames.filter(($) => {
      const cd = $[commentDoc] as unknown as { author?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!cd && cd.author === u;
    });
  },
  then: actions([Commenting.deleteComment, { user, comment }]),
});

export const DeleteCommentResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/deleteComment" }, { request }],
    [Commenting.deleteComment, {}, {}], // Success is an empty object
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const DeleteCommentResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/deleteComment" }, { request }],
    [Commenting.deleteComment, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * When a post is successfully deleted, trigger the deletion of all comments
 * associated with that post. This is a crucial cascading delete sync.
 */
export const PostDeletionCascadeToComments: Sync = ({ post }) => ({
  when: actions(
    [Posting.delete, { post }, {}],
  ),
  then: actions(
    [Commenting.deleteAllCommentsForPost, { post }],
  ),
});

/**
 * When a request to send a friend request is made, verify the sender is logged in,
 * the recipient exists, they are not the same person, and they are not already friends.
 */
export const SendFriendRequest: Sync = (
  { request, session, toUsername, fromUser, toUser, toUserId },
) => ({
  when: actions([Requesting.request, {
    path: "/Friending/sendRequest",
    session,
    toUsername,
  }, { request }]),
  where: async (frames) => {
    // 1. Authenticate sender -> map session -> fromUser
    frames = await frames.query(SessionLogging._getUser, { session }, {
      fromUser,
    });
    if (frames.length === 0) return frames;

    // 2. Verify recipient exists (also bind recipient id)
    frames = await frames.query(
      PasswordAuthentication._getUserByUsernameForSync,
      { username: toUsername },
      { toUser, toUserId },
    );
    if (frames.length === 0) return frames;

    // 3. Validate: cannot friend yourself
    frames = frames.filter(($) =>
      ($[fromUser] as unknown as ID) !== ($[toUserId] as unknown as ID)
    );

    // 4. Validate: cannot send request if already friends
    const keepFriend: boolean[] = [];
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const areFriends = await Friending._isFriends({
        user1: frame[fromUser] as unknown as ID,
        user2: frame[toUserId] as unknown as ID,
      });
      keepFriend[i] = !(areFriends.areFriends && areFriends.areFriends[0]);
    }
    return frames.filter((_, idx) => !!keepFriend[idx]);
  },
  then: actions([Friending.sendRequest, { from: fromUser, to: toUserId }]),
});

export const SendFriendRequestResponse: Sync = (
  { request, friendRequest },
) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/sendRequest" }, { request }],
    [Friending.sendRequest, {}, { friendRequest }],
  ),
  then: actions([Requesting.respond, { request, friendRequest }]),
});

export const SendFriendRequestResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/sendRequest" }, { request }],
    [Friending.sendRequest, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * When a request to create a post is made, verify the user is logged in
 * and use their ID as the author of the post.
 */
export const CreatePostRequest: Sync = (
  { request, session, content, user },
) => ({
  when: actions([Requesting.request, {
    path: "/Posting/create",
    session,
    content,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(SessionLogging._getUser, { session }, { user });
  },
  then: actions([Posting.create, { author: user, content }]),
});

export const CreatePostResponse: Sync = ({ request, post }) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/create" }, { request }],
    [Posting.create, {}, { post }],
  ),
  then: actions([Requesting.respond, { request, post }]),
});

export const CreatePostResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/create" }, { request }],
    [Posting.create, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * When a request to delete a post is made, verify the user is logged in
 * and is the author of the post before deleting it.
 */
export const DeletePostRequest: Sync = (
  { request, session, post, user, postDoc },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Posting/delete", session, post },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate user -> map session -> user (owner)
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    if (frames.length === 0) return frames;

    // 2. Get the post to check its author (adapt concept return shape)
    frames = await frames.query(Posting._getPostByIdForSync, { post }, {
      postDoc,
    });

    // 3. Authorize: only the author can delete
    return frames.filter(($) => {
      const pd = $[postDoc] as unknown as { author?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!pd && pd.author === u;
    });
  },
  then: actions([Posting.delete, { post }]),
});

export const DeletePostResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/delete" }, { request }],
    [Posting.delete, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const DeletePostResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/delete" }, { request }],
    [Posting.delete, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Action: requestUploadUrl ---
// An authenticated user can request a URL to upload a file.
export const RequestUploadUrl: Sync = (
  { request, session, user, filename, contentType },
) => ({
  when: actions([
    Requesting.request,
    { path: "/api/File/requestUploadUrl", session, filename, contentType },
    { request },
  ]),
  where: async (frames) => {
    return await frames.query(SessionLogging._getUser, { session }, { user });
  },
  then: actions([
    File.requestUploadUrl,
    { owner: user, filename, contentType },
  ]),
});

export const RequestUploadUrlResponse: Sync = (
  { request, fileId, uploadUrl, error },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/api/File/requestUploadUrl" },
      { request },
    ],
    [File.requestUploadUrl, {}, { fileId, uploadUrl, error }],
  ),
  then: actions([Requesting.respond, { request, fileId, uploadUrl, error }]),
});

// --- Action: confirmUpload ---
// The owner of a file can confirm that the upload is complete.
export const ConfirmUpload: Sync = (
  { request, session, user, fileId, file },
) => ({
  when: actions([
    Requesting.request,
    { path: "/api/File/confirmUpload", session, fileId },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    frames = await frames.query(File._getFileByIdForSync, { file: fileId }, {
      file,
    });
    // Authorization: ensure the user owns the file they are confirming.
    return frames.filter(($) => {
      const f = $[file] as unknown as { owner?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!f && f.owner === u;
    });
  },
  then: actions([File.confirmUpload, { file: fileId }]),
});

export const ConfirmUploadResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/File/confirmUpload" }, { request }],
    [File.confirmUpload, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, success: true, error }]),
});

// --- Query: _getFilesByOwner ---
// A user can request a list of their own files.
export const GetMyFiles: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/File/_getFilesByOwner", session },
    { request },
  ]),
  where: async (frames) => {
    return await frames.query(SessionLogging._getUser, { session }, { user });
  },
  then: actions([File._getFilesByOwner, { owner: user }]),
});

export const GetMyFilesResponse: Sync = ({ request, files, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/File/_getFilesByOwner" }, { request }],
    [File._getFilesByOwner, {}, { files, error }],
  ),
  then: actions([Requesting.respond, { request, files, error }]),
});

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
    return await frames.query(SessionLogging._getUser, {
      session: sessionToken,
    }, {
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
  {
    request,
    sessionToken,
    user,
    sessionDetails,
    sessionId,
    species,
    count,
    notes,
  },
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
    frames = await frames.query(
      SessionLogging._getUser,
      { session: sessionToken },
      {
        user,
      },
    );
    // 2. Fetch the details of the birding session they want to modify
    frames = await frames.query(
      SessionLogging._getSessionDetails,
      { sessionId },
      { sessionDetails },
    );
    // 3. Authorize: ensure the authenticated user owns the session. If not, the frame is removed.
    return frames.filter(($) => {
      const sd = $[sessionDetails] as unknown as { user?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!sd && sd.user === u;
    });
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
    frames = await frames.query(
      SessionLogging._getUser,
      { session: sessionToken },
      {
        user,
      },
    );
    // 2. Fetch session details for authorization
    frames = await frames.query(
      SessionLogging._getSessionDetails,
      { sessionId },
      { sessionDetails },
    );
    // 3. Authorize
    return frames.filter(($) => {
      const sd = $[sessionDetails] as unknown as { user?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!sd && sd.user === u;
    });
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
    frames = await frames.query(
      SessionLogging._getUser,
      { session: sessionToken },
      {
        user,
      },
    );
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
    frames = await frames.query(
      SessionLogging._getUser,
      { session: sessionToken },
      {
        user,
      },
    );
    // 2. Fetch session details
    frames = await frames.query(
      SessionLogging._getSessionDetails,
      { sessionId },
      { sessionDetails },
    );
    // 3. Authorize and return ONLY if the user is the owner
    return frames.filter(($) => {
      const sd = $[sessionDetails] as unknown as { user?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!sd && sd.user === u;
    });
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
    frames = await frames.query(
      SessionLogging._getUser,
      { session: sessionToken },
      {
        user,
      },
    );
    // 2. Fetch session details for authorization
    frames = await frames.query(
      SessionLogging._getSessionDetails,
      { sessionId },
      { sessionDetails },
    );
    // 3. Authorize by filtering
    frames = frames.filter(($) => {
      const sd = $[sessionDetails] as unknown as { user?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!sd && sd.user === u;
    });
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
    frames = await frames.query(
      SessionLogging._getUser,
      { session: sessionToken },
      {
        user,
      },
    );
    // 2. Fetch session details for authorization
    frames = await frames.query(
      SessionLogging._getSessionDetails,
      { sessionId },
      { sessionDetails },
    );
    // 3. Authorize by filtering
    frames = frames.filter(($) => {
      const sd = $[sessionDetails] as unknown as { user?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!sd && sd.user === u;
    });
    // 4. If authorized, query for the active status
    return await frames.query(
      SessionLogging._isSessionActive,
      { sessionId },
      { isActive },
    );
  },
  then: actions([Requesting.respond, { request, isActive }]),
});

// --- Query: _getUserById ---
// An authenticated user can get a user's public info by their ID.
export const GetUserByIdRequest: Sync = ({ request, session, id, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/PasswordAuthentication/_getUserById", session, id },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate the user making the request
    return await frames.query(SessionLogging._getUser, { session }, { user });
  },
  then: actions([PasswordAuthentication._getUserById, { id }]),
});

export const GetUserByIdResponse: Sync = ({ request, user, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/api/PasswordAuthentication/_getUserById" },
      { request },
    ],
    [PasswordAuthentication._getUserById, {}, { user, error }],
  ),
  then: actions([Requesting.respond, { request, user, error }]),
});

// --- Query: _getUserByUsername ---
// An authenticated user can get a user's public info by their username.
export const GetUserByUsernameRequest: Sync = (
  { request, session, username, user },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/api/PasswordAuthentication/_getUserByUsername",
      session,
      username,
    },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate the user making the request
    return await frames.query(SessionLogging._getUser, { session }, { user });
  },
  then: actions([PasswordAuthentication._getUserByUsername, { username }]),
});

export const GetUserByUsernameResponse: Sync = ({ request, user, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/api/PasswordAuthentication/_getUserByUsername" },
      { request },
    ],
    [PasswordAuthentication._getUserByUsername, {}, { user, error }],
  ),
  then: actions([Requesting.respond, { request, user, error }]),
});

// --- Query: _getAllUsers ---
// Any authenticated user can get a list of all users.
// Note: In a real-world scenario, you might restrict this to an admin role.
export const GetAllUsersRequest: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/api/PasswordAuthentication/_getAllUsers", session },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate the user making the request
    return await frames.query(SessionLogging._getUser, { session }, { user });
  },
  then: actions([PasswordAuthentication._getAllUsers, {}]),
});

export const GetAllUsersResponse: Sync = ({ request, users, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/api/PasswordAuthentication/_getAllUsers" },
      { request },
    ],
    [PasswordAuthentication._getAllUsers, {}, { users, error }],
  ),
  then: actions([Requesting.respond, { request, users, error }]),
});

```
