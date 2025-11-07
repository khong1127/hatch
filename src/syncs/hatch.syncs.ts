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
  // API-prefixed variant (session-based). Plain path handled by AddCommentPlain* syncs.
  when: actions([Requesting.request, {
    path: "/api/Commenting/addComment",
    session,
    content,
    post,
  }, { request }]),
  where: async (frames) => {
    // 1. Authenticate user -> map session -> user (owner)
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    if (frames.length === 0) return frames; // Stop if not authenticated

    // 2. Verify post exists (adapt concept return shape to bind as { postDoc })
    frames = await frames.query(
      async ({ post: p }) => {
        const postDocs = await Posting._getPostByIdForSync({ post: p as ID });
        return postDocs.map((doc) => ({ postDoc: doc }));
      },
      { post },
      { postDoc },
    );
    if (frames.length === 0) return frames; // Stop if post doesn't exist

    // 3. Authorize: user can see the post if they are the author OR are friends with the author
    const keep: boolean[] = [];
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i] as Record<symbol, unknown>;
      const postVal = frame[postDoc];
      const currentUser = frame[user];

      // postVal may be a full post document or an author id; handle both
      let postAuthorId: unknown = postVal;
      if (
        postVal && typeof postVal === "object" &&
        "author" in (postVal as Record<string, unknown>)
      ) {
        postAuthorId = (postVal as Record<string, unknown>).author;
      }

      if (postAuthorId === currentUser) {
        keep[i] = true;
        continue;
      }

      // Friending stores usernames; convert both ids to usernames before checking friendship
      const [curDocs, authDocs] = await Promise.all([
        PasswordAuthentication._getUserById(currentUser as ID),
        PasswordAuthentication._getUserById(postAuthorId as ID),
      ]);
      const curName = (Array.isArray(curDocs) && curDocs[0]?.username) as
        | string
        | undefined;
      const authName = (Array.isArray(authDocs) && authDocs[0]?.username) as
        | string
        | undefined;
      if (!curName || !authName) {
        keep[i] = false;
        continue;
      }
      const friendCheck = await Friending._isFriends({
        user1: curName as unknown as ID,
        user2: authName as unknown as ID,
      });
      keep[i] = !!(friendCheck.areFriends && friendCheck.areFriends[0]);
    }
    return frames.filter((_, idx) => !!keep[idx]);
  },
  then: actions([Commenting.addComment, { author: user, content, post }]),
});

/**
 * Plain path variant for adding a comment. Frontend supplies author (user id) directly.
 */
export const AddCommentPlainRequest: Sync = (
  { request, author, content, post },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Commenting/addComment", author, content, post },
    { request },
  ]),
  then: actions([Commenting.addComment, { author, content, post }]),
});

export const AddCommentPlainResponse: Sync = ({ request, comment }) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/addComment" }, { request }],
    [Commenting.addComment, {}, { comment }],
  ),
  then: actions([Requesting.respond, { request, comment }]),
});

export const AddCommentPlainError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/addComment" }, { request }],
    [Commenting.addComment, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Plain path variant for editing a comment. Frontend supplies user id directly.
 */
export const EditCommentPlainRequest: Sync = (
  { request, user, comment, new_content },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Commenting/editComment", user, comment, new_content },
    { request },
  ]),
  then: actions([Commenting.editComment, { user, comment, new_content }]),
});

export const EditCommentPlainResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/editComment" }, { request }],
    [Commenting.editComment, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const EditCommentPlainError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/editComment" }, { request }],
    [Commenting.editComment, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Plain path variant for deleting a comment when frontend supplies username as `user`.
 * Resolves username -> user id, then invokes deleteComment (ownership verified in concept).
 */
export const DeleteCommentPlainRequest: Sync = (
  { request, user, comment },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Commenting/deleteComment", user, comment },
    { request },
  ]),
  then: actions([Commenting.deleteComment, { user, comment }]),
});

export const DeleteCommentPlainResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/deleteComment" }, { request }],
    [Commenting.deleteComment, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const DeleteCommentPlainError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/deleteComment" }, { request }],
    [Commenting.deleteComment, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Plain path variant for adding a comment. Frontend supplies author (user id) directly.
 * Skips username resolution and friend authorization (assumes caller only shows add UI when allowed).
 */
/**
 * When a post is successfully deleted, cascade delete all its comments.
 */
export const PostDeletionCascadeToComments: Sync = ({ post }) => ({
  when: actions(
    [Posting.delete, { post }, {}],
  ),
  then: actions(
    [Commenting.deleteAllCommentsForPost, { post }],
  ),
});
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
  // Friending stores usernames in friendRequests/friendships collections.
  then: actions([Friending.sendRequest, {
    sender: fromUser,
    receiver: toUserId,
  }]),
});

export const SendFriendRequestResponse: Sync = (
  { request, friendRequest },
) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/sendRequest" }, { request }],
    // Match successful sendRequest by binding the returned `request` id
    [Friending.sendRequest, {}, { request: friendRequest }],
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
 * Plain path variant for sending a friend request with usernames.
 * Frontend supplies { sender, receiver } as usernames; pass directly to concept.
 */
export const SendFriendRequestPlainRequest: Sync = (
  { request, sender, receiver },
) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/sendRequest", sender, receiver }, {
      request,
    }],
  ),
  then: actions([Friending.sendRequest, { sender, receiver }]),
});

export const SendFriendRequestPlainResponse: Sync = (
  { request, friendRequest },
) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/sendRequest" }, { request }],
    // Bind concept's `{ request }` to our `friendRequest` output symbol
    [Friending.sendRequest, {}, { request: friendRequest }],
  ),
  then: actions([Requesting.respond, { request, friendRequest }]),
});

export const SendFriendRequestPlainError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/sendRequest" }, { request }],
    [Friending.sendRequest, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// ============================================================================
// Friending: acceptRequest / denyRequest (plain username variants)
// Friend requests & friendships are stored using usernames (not user IDs), so
// we pass the provided usernames directly to the concept actions.
// ============================================================================

export const AcceptFriendRequestPlainRequest: Sync = (
  { request, sender, receiver },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Friending/acceptRequest", sender, receiver },
      { request },
    ],
  ),
  then: actions([Friending.acceptRequest, { sender, receiver }]),
});

export const AcceptFriendRequestPlainResponse: Sync = (
  { request },
) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/acceptRequest" }, { request }],
    [Friending.acceptRequest, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const AcceptFriendRequestPlainError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/acceptRequest" }, { request }],
    [Friending.acceptRequest, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const DenyFriendRequestPlainRequest: Sync = (
  { request, sender, receiver },
) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/denyRequest", sender, receiver }, {
      request,
    }],
  ),
  then: actions([Friending.denyRequest, { sender, receiver }]),
});

export const DenyFriendRequestPlainResponse: Sync = (
  { request },
) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/denyRequest" }, { request }],
    [Friending.denyRequest, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const DenyFriendRequestPlainError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/denyRequest" }, { request }],
    [Friending.denyRequest, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Plain path variant for removing a friend when frontend supplies usernames.
 * Passes usernames directly to removeFriend (friendships are stored with usernames, not IDs).
 */
export const RemoveFriendPlainRequest: Sync = (
  {
    request,
    user,
    to_be_removed_friend,
  },
) => ({
  when: actions(
    [Requesting.request, {
      path: "/Friending/removeFriend",
      user,
      to_be_removed_friend,
    }, { request }],
  ),
  then: actions([Friending.removeFriend, {
    user,
    to_be_removed_friend,
  }]),
});

export const RemoveFriendPlainResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/removeFriend" }, { request }],
    [Friending.removeFriend, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const RemoveFriendPlainError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/removeFriend" }, { request }],
    [Friending.removeFriend, {}, { error }],
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

/**
 * Plain path variant for editing a post (frontend supplies user id directly).
 * Invokes Posting.edit and always responds to avoid timeouts.
 */
export const EditPostPlainRequest: Sync = (
  { request, user, post, new_caption },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Posting/edit", user, post, new_caption },
    { request },
  ]),
  then: actions([Posting.edit, { user, post, new_caption }]),
});

export const EditPostPlainResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/edit" }, { request }],
    [Posting.edit, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const EditPostPlainError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/edit" }, { request }],
    [Posting.edit, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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

/**
 * Plain path variant for deleting a post. Frontend supplies user id directly.
 * Ownership is enforced in the Posting concept; we just forward the call.
 */
export const DeletePostPlainRequest: Sync = (
  { request, user, post },
) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/delete", user, post }, { request }],
  ),
  then: actions([Posting.delete, { user, post }]),
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
//  Start a new Birding Session (startSession)
// =============================================================================

/**
 * Handles the request to start a new birding session.
 * It first authenticates the user via their session token before proceeding.
 */
export const StartSessionRequest: Sync = (
  { request, session, user, startTime, location },
) => ({
  when: actions([
    Requesting.request,
    { path: "/api/SessionLogging/startSession", session, startTime, location },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate: Get the user associated with the auth session token.
    return await frames.query(SessionLogging._getUser, { session }, { user });
  },
  then: actions([
    SessionLogging.startSession,
    // The user variable from the 'where' clause is passed to the concept.
    { user, startTime, location },
  ]),
});

/**
 * Responds to the requestor when a birding session is successfully started.
 */
export const StartSessionResponse: Sync = ({ request, newSession }) => ({
  when: actions(
    [Requesting.request, { path: "/api/SessionLogging/startSession" }, {
      request,
    }],
    [SessionLogging.startSession, {}, { newSession }],
  ),
  then: actions([Requesting.respond, { request, newSession }]),
});

/**
 * Responds with an error if starting the birding session fails.
 */
export const StartSessionError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/SessionLogging/startSession" }, {
      request,
    }],
    [SessionLogging.startSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
//  Add an Entry to an existing Session (addEntry)
// =============================================================================

/**
 * Handles the request to add an entry to a birding session.
 * It authenticates the user and then authorizes them by checking
 * if they are the owner of the session they're trying to modify.
 */
export const AddEntryRequest: Sync = (
  { request, session, user, sessionId, entry, sessionDetails },
) => ({
  when: actions([
    Requesting.request,
    { path: "/api/SessionLogging/addEntry", session, sessionId, entry },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate the user.
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    if (frames.length === 0) return frames; // Stop if not authenticated.

    // 2. Authorize: Check if the authenticated user owns the target birding session.
    frames = await frames.query(SessionLogging._getSessionDetails, {
      session: sessionId,
    }, { sessionDetails });
    return frames.filter(($) => {
      const sd = $[sessionDetails] as unknown as { owner?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!sd && sd.owner === u;
    });
  },
  then: actions([
    SessionLogging.addEntry,
    { user, session: sessionId, image: entry },
  ]),
});

/**
 * Responds when an entry is successfully added.
 */
export const AddEntryResponse: Sync = ({ request, newEntry }) => ({
  when: actions(
    [Requesting.request, { path: "/api/SessionLogging/addEntry" }, { request }],
    [SessionLogging.addEntry, {}, { newEntry }],
  ),
  then: actions([Requesting.respond, { request, newEntry }]),
});

/**
 * Responds with an error if adding an entry fails.
 */
export const AddEntryError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/SessionLogging/addEntry" }, { request }],
    [SessionLogging.addEntry, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
//  End a Session (endSession)
// =============================================================================

/**
 * Handles the request to end a birding session.
 * It authenticates the user and authorizes them by checking ownership of the session.
 */
export const EndSessionRequest: Sync = (
  { request, session, user, sessionId, sessionDetails },
) => ({
  when: actions([
    Requesting.request,
    { path: "/api/SessionLogging/endSession", session, sessionId },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate.
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    if (frames.length === 0) return frames;

    // 2. Authorize by checking ownership.
    frames = await frames.query(SessionLogging._getSessionDetails, {
      session: sessionId,
    }, { sessionDetails });
    return frames.filter(($) => {
      const sd = $[sessionDetails] as unknown as { owner?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!sd && sd.owner === u;
    });
  },
  then: actions([
    SessionLogging.endSession,
    { user, session: sessionId },
  ]),
});

/**
 * Responds when a session is successfully ended.
 */
export const EndSessionResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/api/SessionLogging/endSession" }, {
      request,
    }],
    // endSession might return an Empty object on success, which we match with {}.
    [SessionLogging.endSession, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "ended" }]),
});

/**
 * Responds with an error if ending the session fails.
 */
export const EndSessionError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/SessionLogging/endSession" }, {
      request,
    }],
    [SessionLogging.endSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
//  Queries (single sync for request and response)
// =============================================================================

/**
 * Gets all birding sessions for the currently logged-in user.
 */
export const GetSessionsByUser: Sync = (
  { request, session, user, sessions },
) => ({
  when: actions(
    [Requesting.request, {
      path: "/api/SessionLogging/_getSessionsByUser",
      session,
    }, { request }],
  ),
  where: async (frames) => {
    // Authenticate the user, then use the resulting user ID for the query.
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    return await frames.query(SessionLogging._getSessionsByUser, { user }, {
      sessions,
    });
  },
  then: actions([Requesting.respond, { request, sessions }]),
});

/**
 * Gets the details for a specific birding session, ensuring the requestor is the owner.
 */
export const GetSessionDetails: Sync = (
  { request, session, user, sessionId, sessionDetails },
) => ({
  when: actions(
    [Requesting.request, {
      path: "/api/SessionLogging/_getSessionDetails",
      session,
      sessionId,
    }, { request }],
  ),
  where: async (frames) => {
    // 1. Authenticate user.
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    if (frames.length === 0) return frames;

    // 2. Fetch the session details.
    frames = await frames.query(SessionLogging._getSessionDetails, {
      session: sessionId,
    }, { sessionDetails });

    // 3. Authorize: Filter to ensure the result belongs to the authenticated user.
    return frames.filter(($) => {
      const sd = $[sessionDetails] as unknown as { owner?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!sd && sd.owner === u;
    });
  },
  then: actions([Requesting.respond, { request, sessionDetails }]),
});

/**
 * Gets all entries for a specific birding session, ensuring the requestor is the owner.
 */
export const GetEntriesInSession: Sync = (
  { request, session, user, sessionId, sessionDetails, entries },
) => ({
  when: actions(
    [Requesting.request, {
      path: "/api/SessionLogging/_getEntriesInSession",
      session,
      sessionId,
    }, { request }],
  ),
  where: async (frames) => {
    // 1. Authenticate user.
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    if (frames.length === 0) return frames;

    // 2. Authorize: Ensure user owns the parent session before fetching its entries.
    frames = await frames.query(SessionLogging._getSessionDetails, {
      session: sessionId,
    }, { sessionDetails });
    frames = frames.filter(($) => {
      const sd = $[sessionDetails] as unknown as { owner?: ID } | undefined;
      const u = $[user] as unknown as ID;
      return !!sd && sd.owner === u;
    });
    if (frames.length === 0) return frames;

    // 3. Fetch the entries.
    return await frames.query(SessionLogging._getEntriesInSession, {
      sessionId,
    }, { entries });
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

// ============================================================================
// Plain path (no /api base) aliases to respond to current frontend calls
// ============================================================================

// PasswordAuthentication: _getAllUsers (no /api)
export const GetAllUsersPlain: Sync = ({ request, users }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/_getAllUsers" }, {
      request,
    }],
  ),
  where: async (frames) => {
    // Directly fetch all users and bind as { users }
    return await frames.query(
      async () => {
        const res = await PasswordAuthentication._getAllUsers();
        return [{ users: res }];
      },
      {},
      { users },
    );
  },
  then: actions([Requesting.respond, { request, users }]),
});

// PasswordAuthentication: _getUserByUsername (no /api)
export const GetUserByUsernamePlain: Sync = ({ request, username, user }) => ({
  when: actions(
    [Requesting.request, {
      path: "/PasswordAuthentication/_getUserByUsername",
      username,
    }, {
      request,
    }],
  ),
  where: async (frames) => {
    // Directly fetch user by username
    return await frames.query(
      async ({ username: un }) => {
        const res = await PasswordAuthentication._getUserByUsername({
          username: un,
        });
        // _getUserByUsername returns UserDocument[] array, take first element
        return res.length > 0 ? [{ user: res[0] }] : [];
      },
      { username },
      { user },
    );
  },
  then: actions([Requesting.respond, { request, user }]),
});

// Friending: _getFriends (expects { user })
export const GetFriendsPlain: Sync = ({ request, user, friends }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/_getFriends", user }, { request }],
  ),
  where: async (frames) => {
    return await frames.query(
      async ({ user: u }) => {
        const res = await Friending._getFriends({ user: u });
        return [{ friends: res.friends }];
      },
      { user },
      { friends },
    );
  },
  then: actions([Requesting.respond, { request, friends }]),
});

// Friending: _getSentFriendRequests (expects { sender })
export const GetSentFriendRequestsPlain: Sync = (
  { request, sender, sentRequests },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Friending/_getSentFriendRequests", sender },
      { request },
    ],
  ),
  where: async (frames) => {
    return await frames.query(
      async ({ sender: s }) => {
        const res = await Friending._getSentFriendRequests({ sender: s });
        return [{ sentRequests: res.sentRequests }];
      },
      { sender },
      { sentRequests },
    );
  },
  then: actions([Requesting.respond, { request, sentRequests }]),
});

// Friending: _getReceivedFriendRequests (expects { receiver })
export const GetReceivedFriendRequestsPlain: Sync = (
  { request, receiver, receivedRequests },
) => ({
  when: actions(
    [Requesting.request, {
      path: "/Friending/_getReceivedFriendRequests",
      receiver,
    }, { request }],
  ),
  where: async (frames) => {
    return await frames.query(
      async ({ receiver: r }) => {
        const res = await Friending._getReceivedFriendRequests({ receiver: r });
        return [{ receivedRequests: res.receivedRequests }];
      },
      { receiver },
      { receivedRequests },
    );
  },
  then: actions([Requesting.respond, { request, receivedRequests }]),
});

// Posting: _getPostsByAuthor (expects { user })
export const GetPostsByAuthorPlain: Sync = (
  { request, user, posts },
) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/_getPostsByAuthor", user }, {
      request,
    }],
  ),
  where: async (frames) => {
    return await frames.query(
      async ({ user: u }) => {
        // Try treating `user` as a user ID first
        let { posts } = await Posting._getPostsByAuthor({ user: u as ID });
        // Fallback: if empty, try resolving `user` as a username -> id
        if (!Array.isArray(posts) || posts.length === 0) {
          const docs = await PasswordAuthentication._getUserByUsername(
            u as unknown as string,
          );
          const userId = docs.length > 0 ? docs[0]._id : undefined;
          if (userId) {
            const res2 = await Posting._getPostsByAuthor({ user: userId });
            posts = res2.posts;
          }
        }
        const safePosts = Array.isArray(posts) ? posts : [];
        // Transform: author ID -> username, image IDs -> URLs
        const uniqueAuthors = Array.from(
          new Set(safePosts.map((p) => p.author as unknown as ID)),
        );
        const authorNameMap = new Map<ID, string>();
        for (const aid of uniqueAuthors) {
          const arr = await PasswordAuthentication._getUserById(aid);
          const doc = Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
          authorNameMap.set(aid, (doc?.username as string) ?? String(aid));
        }
        // Determine a viewer user id for signing view URLs (use resolved author id or provided id/username)
        let viewerId: ID | undefined;
        {
          const maybeDocs = await PasswordAuthentication._getUserByUsername(
            u as unknown as string,
          );
          viewerId = (maybeDocs && maybeDocs[0]?._id)
            ? (maybeDocs[0]._id as ID)
            : (u as ID);
        }
        const transformImage = async (img: unknown): Promise<string> => {
          const s = String(img ?? "");
          if (s.startsWith("http://") || s.startsWith("https://")) return s;
          // treat as file id
          const r = await File._getFileById({ file: s as unknown as ID });
          const f = (r as { file?: { bucket: string; object: string } }).file;
          if (f && viewerId && f.object) {
            const signed = await File.getViewUrl({
              user: viewerId,
              object: f.object,
            });
            if ("url" in signed && typeof signed.url === "string") {
              return signed.url;
            }
          }
          return s;
        };
        type PostView = {
          _id: ID;
          caption: string;
          images: string[]; // plain URLs expected by frontend
          author: string; // username for display
          createdAt: Date;
        };
        const postsView: PostView[] = [];
        for (const p of safePosts) {
          const images = Array.isArray(p.images) ? p.images : [];
          const imageUrls = await Promise.all(images.map(transformImage));
          postsView.push({
            _id: p._id as ID,
            caption: p.caption,
            author: authorNameMap.get(p.author as unknown as ID) ??
              String(p.author),
            images: imageUrls,
            createdAt: p.createdAt,
          });
        }
        return [{ posts: postsView }];
      },
      { user },
      { posts },
    );
  },
  then: actions([Requesting.respond, { request, posts }]),
});

// Posting: getFeedForUser (fallback implementation: user's own posts)
export const GetFeedForUserPlain: Sync = ({ request, user, posts }) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/getFeedForUser", user }, {
      request,
    }],
  ),
  where: async (frames) => {
    // Minimal feed: return the user's own posts
    return await frames.query(
      async ({ user: u }) => {
        // Try ID first, then fallback to resolving username
        let { posts } = await Posting._getPostsByAuthor({ user: u as ID });
        if (!Array.isArray(posts) || posts.length === 0) {
          const docs = await PasswordAuthentication._getUserByUsername(
            u as unknown as string,
          );
          const userId = docs.length > 0 ? docs[0]._id : undefined;
          if (userId) {
            const res2 = await Posting._getPostsByAuthor({ user: userId });
            posts = res2.posts;
          }
        }
        const safePosts = Array.isArray(posts) ? posts : [];
        // Transform author -> username and image ids -> urls
        const uniqueAuthors = Array.from(
          new Set(safePosts.map((p) => p.author as unknown as ID)),
        );
        const authorNameMap = new Map<ID, string>();
        for (const aid of uniqueAuthors) {
          const arr = await PasswordAuthentication._getUserById(aid);
          const doc = Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
          authorNameMap.set(aid, (doc?.username as string) ?? String(aid));
        }
        // Determine viewer id for signing
        let viewerId: ID | undefined;
        {
          const maybeDocs = await PasswordAuthentication._getUserByUsername(
            u as unknown as string,
          );
          viewerId = (maybeDocs && maybeDocs[0]?._id)
            ? (maybeDocs[0]._id as ID)
            : (u as ID);
        }
        const transformImage = async (img: unknown): Promise<string> => {
          const s = String(img ?? "");
          if (s.startsWith("http://") || s.startsWith("https://")) return s;
          const r = await File._getFileById({ file: s as unknown as ID });
          const f = (r as { file?: { bucket: string; object: string } }).file;
          if (f && viewerId && f.object) {
            const signed = await File.getViewUrl({
              user: viewerId,
              object: f.object,
            });
            if ("url" in signed && typeof signed.url === "string") {
              return signed.url;
            }
          }
          return s;
        };
        type PostView = {
          _id: ID;
          caption: string;
          images: string[]; // plain URLs expected by frontend
          author: string; // username for display
          createdAt: Date;
        };
        const postsView: PostView[] = [];
        for (const p of safePosts) {
          const images = Array.isArray(p.images) ? p.images : [];
          const imageUrls = await Promise.all(images.map(transformImage));
          postsView.push({
            _id: p._id as ID,
            caption: p.caption,
            author: authorNameMap.get(p.author as unknown as ID) ??
              String(p.author),
            images: imageUrls,
            createdAt: p.createdAt,
          });
        }
        return [{ posts: postsView }];
      },
      { user },
      { posts },
    );
  },
  then: actions([Requesting.respond, { request, posts }]),
});

// Posting: _getPostsByAuthor using session (derive user from session)
export const GetMyPostsPlain: Sync = (
  { request, session, user, posts },
) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/_getPostsByAuthor", session }, {
      request,
    }],
  ),
  where: async (frames) => {
    // Map session -> user, then fetch posts by author
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    if (frames.length === 0) return frames;
    return await frames.query(
      async ({ user: u }) => {
        const { posts } = await Posting._getPostsByAuthor({ user: u });
        const safePosts = Array.isArray(posts) ? posts : [];
        return [{ posts: safePosts }];
      },
      { user },
      { posts },
    );
  },
  then: actions([Requesting.respond, { request, posts }]),
});

// Posting: getFeedForUser using session (derive user from session)
export const GetFeedForUserBySessionPlain: Sync = (
  { request, session, user, posts },
) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/getFeedForUser", session }, {
      request,
    }],
  ),
  where: async (frames) => {
    // Derive user from session and return their own posts (minimal feed)
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    if (frames.length === 0) return frames;
    return await frames.query(
      async ({ user: u }) => {
        const { posts } = await Posting._getPostsByAuthor({ user: u });
        const safePosts = Array.isArray(posts) ? posts : [];
        return [{ posts: safePosts }];
      },
      { user },
      { posts },
    );
  },
  then: actions([Requesting.respond, { request, posts }]),
});

// Posting: getFeedForUser using sessionToken (frontend may send sessionToken instead of session)
export const GetFeedForUserBySessionTokenPlain: Sync = (
  { request, sessionToken, user, posts },
) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/getFeedForUser", sessionToken }, {
      request,
    }],
  ),
  where: async (frames) => {
    // Map sessionToken -> user id, then fetch posts by author
    frames = await frames.query(
      SessionLogging._getUser,
      { session: sessionToken },
      { user },
    );
    if (frames.length === 0) return frames;
    return await frames.query(
      async ({ user: u }) => {
        const { posts } = await Posting._getPostsByAuthor({ user: u });
        const safePosts = Array.isArray(posts) ? posts : [];
        return [{ posts: safePosts }];
      },
      { user },
      { posts },
    );
  },
  then: actions([Requesting.respond, { request, posts }]),
});

// Posting: _getPostsByAuthor by username (frontend may send username instead of user id)
export const GetPostsByAuthorByUsernamePlain: Sync = (
  { request, username, user, posts },
) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/_getPostsByAuthor", username }, {
      request,
    }],
  ),
  where: async (frames) => {
    // Resolve username -> user id, then fetch posts by author
    frames = await frames.query(
      async ({ username: un }) => {
        const docs = await PasswordAuthentication._getUserByUsername(un);
        return docs.map(({ _id }) => ({ user: _id as ID }));
      },
      { username },
      { user },
    );
    if (frames.length === 0) return frames;
    return await frames.query(
      async ({ user: u }) => {
        const { posts } = await Posting._getPostsByAuthor({ user: u });
        const safePosts = Array.isArray(posts) ? posts : [];
        return [{ posts: safePosts }];
      },
      { user },
      { posts },
    );
  },
  then: actions([Requesting.respond, { request, posts }]),
});

// Posting: _getPostsByAuthor by author param alias (author treated as user id)
export const GetPostsByAuthorByAuthorPlain: Sync = (
  { request, author, posts },
) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/_getPostsByAuthor", author }, {
      request,
    }],
  ),
  where: async (frames) => {
    return await frames.query(
      async ({ author: a }) => {
        // Try treating author as a user ID first
        let { posts } = await Posting._getPostsByAuthor({ user: a as ID });
        if (!Array.isArray(posts) || posts.length === 0) {
          // If no posts, try resolving `author` as a username
          const docs = await PasswordAuthentication._getUserByUsername(
            a as unknown as string,
          );
          const userId = docs.length > 0 ? docs[0]._id : undefined;
          if (userId) {
            const res2 = await Posting._getPostsByAuthor({ user: userId });
            posts = res2.posts;
          }
        }
        const safePosts = Array.isArray(posts) ? posts : [];
        return [{ posts: safePosts }];
      },
      { author },
      { posts },
    );
  },
  then: actions([Requesting.respond, { request, posts }]),
});

// ========================= Commenting (plain path) =========================

// Get all comments for a post (expects { post })
export const GetCommentsForPostPlain: Sync = (
  { request, post, comments },
) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/_getCommentsForPost", post }, {
      request,
    }],
  ),
  where: async (frames) => {
    // Fetch comments and normalize author IDs to usernames
    frames = await frames.query(
      async ({ post: p }) => {
        const { comments } = await Commenting._getCommentsForPost({ post: p });
        const arr = Array.isArray(comments) ? comments : [] as Array<{
          author?: ID;
          [k: string]: unknown;
        }>;
        // Build unique author set
        const ids = Array.from(new Set(arr.map((c) => c.author as ID)));
        const nameMap = new Map<ID, string>();
        for (const id of ids) {
          if (!id) continue;
          const docs = await PasswordAuthentication._getUserById(id);
          const doc = Array.isArray(docs) && docs.length > 0
            ? docs[0]
            : undefined;
          nameMap.set(id, (doc?.username as string) ?? String(id));
        }
        const normalized = arr.map((c) => ({
          ...c,
          author: c.author
            ? (nameMap.get(c.author as ID) ?? String(c.author))
            : c.author,
        }));
        return [{ comments: normalized }];
      },
      { post },
      { comments },
    );
    return frames;
  },
  then: actions([Requesting.respond, { request, comments }]),
});

// ========================= SessionLogging (plain path variants) =========================

// Start session when frontend sends username as `user` (no /api prefix)
export const StartSessionPlainRequest: Sync = (
  { request, user },
) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/startSession", user }, {
      request,
    }],
  ),
  // Frontend now supplies user id directly; skip username resolution.
  then: actions([
    SessionLogging.startSession,
    { user },
  ]),
});

export const StartSessionPlainResponse: Sync = (
  { request, session },
) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/startSession" }, { request }],
    [SessionLogging.startSession, {}, { session }],
  ),
  then: actions([Requesting.respond, { request, session }]),
});

export const StartSessionPlainError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/startSession" }, { request }],
    [SessionLogging.startSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Add entry to session when frontend sends plain path with username and image id
export const AddEntryPlainRequest: Sync = (
  { request, user, session, image },
) => ({
  when: actions([
    Requesting.request,
    { path: "/SessionLogging/addEntry", user, session, image },
    { request },
  ]),
  then: actions([
    SessionLogging.addEntry,
    { user, session, image },
  ]),
});

export const AddEntryPlainResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/addEntry" }, { request }],
    [SessionLogging.addEntry, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "success" }]),
});

export const AddEntryPlainError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/addEntry" }, { request }],
    [SessionLogging.addEntry, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// End a session when frontend sends plain path with username and session id
export const EndSessionPlainRequest: Sync = (
  { request, user, session },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SessionLogging/endSession", user, session },
      { request },
    ],
  ),
  then: actions([
    SessionLogging.endSession,
    { user, session },
  ]),
});

export const EndSessionPlainResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/endSession" }, { request }],
    [SessionLogging.endSession, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "ended" }]),
});

export const EndSessionPlainError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/SessionLogging/endSession" }, { request }],
    [SessionLogging.endSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// ========================= Posting (plain path create) =========================
// Plain path variant for creating a post when frontend supplies username, images, caption directly.
// Resolves username -> user id and invokes Posting.create. Always responds (success or error) to avoid timeouts.
export const CreatePostPlainRequest: Sync = (
  { request, user, images, caption },
) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/create", user, images, caption }, {
      request,
    }],
  ),
  // Frontend supplies user id directly now.
  then: actions([
    Posting.create,
    { user, images, caption },
  ]),
});

export const CreatePostPlainResponse: Sync = ({ request, post }) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/create" }, { request }],
    [Posting.create, {}, { post }],
  ),
  then: actions([Requesting.respond, { request, post }]),
});

export const CreatePostPlainError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Posting/create" }, { request }],
    [Posting.create, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Get all comments for a post by postId alias (expects { postId })
export const GetCommentsForPostByPostIdPlain: Sync = (
  { request, postId, comments },
) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/_getCommentsForPost", postId }, {
      request,
    }],
  ),
  where: async (frames) => {
    frames = await frames.query(
      async ({ postId: p }) => {
        const { comments } = await Commenting._getCommentsForPost({
          post: p as ID,
        });
        const arr = Array.isArray(comments)
          ? comments
          : [] as Array<{ author?: ID; [k: string]: unknown }>;
        const ids = Array.from(new Set(arr.map((c) => c.author as ID)));
        const nameMap = new Map<ID, string>();
        for (const id of ids) {
          if (!id) continue;
          const docs = await PasswordAuthentication._getUserById(id);
          const doc = Array.isArray(docs) && docs.length > 0
            ? docs[0]
            : undefined;
          nameMap.set(id, (doc?.username as string) ?? String(id));
        }
        const normalized = arr.map((c) => ({
          ...c,
          author: c.author
            ? (nameMap.get(c.author as ID) ?? String(c.author))
            : c.author,
        }));
        return [{ comments: normalized }];
      },
      { postId },
      { comments },
    );
    return frames;
  },
  then: actions([Requesting.respond, { request, comments }]),
});

// ========================= File (plain path variants) =========================

// Request upload URL when frontend sends username as `user` (no /api prefix)
export const RequestUploadUrlPlain: Sync = (
  { request, user, filename, contentType, expiresInSeconds },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/File/requestUploadUrl",
      user,
      filename,
      contentType,
      expiresInSeconds,
    },
    { request },
  ]),
  // Frontend provides user id directly; skip username resolution.
  then: actions([
    File.requestUploadUrl,
    { user, filename, contentType, expiresInSeconds },
  ]),
});

export const RequestUploadUrlPlainResponse: Sync = (
  { request, uploadUrl, bucket, object },
) => ({
  when: actions(
    [Requesting.request, { path: "/File/requestUploadUrl" }, { request }],
    [File.requestUploadUrl, {}, { uploadUrl, bucket, object }],
  ),
  then: actions([Requesting.respond, { request, uploadUrl, bucket, object }]),
});

export const RequestUploadUrlPlainError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/File/requestUploadUrl" }, { request }],
    [File.requestUploadUrl, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Get all comments by author (expects { author })
export const GetCommentsByAuthorPlain: Sync = (
  { request, author, comments },
) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/_getCommentsByAuthor", author }, {
      request,
    }],
  ),
  where: async (frames) => {
    return await frames.query(
      async ({ author: a }) => {
        const { comments } = await Commenting._getCommentsByAuthor({
          author: a as ID,
        });
        return [{ comments }];
      },
      { author },
      { comments },
    );
  },
  then: actions([Requesting.respond, { request, comments }]),
});

// Get all comments by author's username (expects { username })
export const GetCommentsByAuthorByUsernamePlain: Sync = (
  { request, username, user, comments },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Commenting/_getCommentsByAuthor", username },
      { request },
    ],
  ),
  where: async (frames) => {
    // Resolve username -> user id, then fetch comments by author
    frames = await frames.query(
      async ({ username: un }) => {
        const docs = await PasswordAuthentication._getUserByUsername(un);
        return docs.map(({ _id }) => ({ user: _id as ID }));
      },
      { username },
      { user },
    );
    if (frames.length === 0) return frames;
    return await frames.query(
      async ({ user: u }) => {
        const { comments } = await Commenting._getCommentsByAuthor({
          author: u,
        });
        const arr = Array.isArray(comments)
          ? comments
          : [] as Array<{ author?: ID; [k: string]: unknown }>;
        const ids = Array.from(new Set(arr.map((c) => c.author as ID)));
        const nameMap = new Map<ID, string>();
        for (const id of ids) {
          if (!id) continue;
          const docs = await PasswordAuthentication._getUserById(id);
          const doc = Array.isArray(docs) && docs.length > 0
            ? docs[0]
            : undefined;
          nameMap.set(id, (doc?.username as string) ?? String(id));
        }
        const normalized = arr.map((c) => ({
          ...c,
          author: c.author
            ? (nameMap.get(c.author as ID) ?? String(c.author))
            : c.author,
        }));
        return [{ comments: normalized }];
      },
      { user },
      { comments },
    );
  },
  then: actions([Requesting.respond, { request, comments }]),
});

// Catch-all variants to reduce timeouts due to differing param naming conventions

// Comments for post when frontend sends postID (camel case) instead of postId or post
export const GetCommentsForPostByPostIDPlain: Sync = (
  { request, postID, comments },
) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/_getCommentsForPost", postID }, {
      request,
    }],
  ),
  where: async (frames) => {
    frames = await frames.query(
      async ({ postID: p }) => {
        const { comments } = await Commenting._getCommentsForPost({
          post: p as ID,
        });
        const arr = Array.isArray(comments)
          ? comments
          : [] as Array<{ author?: ID; [k: string]: unknown }>;
        const ids = Array.from(new Set(arr.map((c) => c.author as ID)));
        const nameMap = new Map<ID, string>();
        for (const id of ids) {
          if (!id) continue;
          const docs = await PasswordAuthentication._getUserById(id);
          const doc = Array.isArray(docs) && docs.length > 0
            ? docs[0]
            : undefined;
          nameMap.set(id, (doc?.username as string) ?? String(id));
        }
        const normalized = arr.map((c) => ({
          ...c,
          author: c.author
            ? (nameMap.get(c.author as ID) ?? String(c.author))
            : c.author,
        }));
        return [{ comments: normalized }];
      },
      { postID },
      { comments },
    );
    return frames;
  },
  then: actions([Requesting.respond, { request, comments }]),
});

// Single comment fetch (path: /Commenting/_getComment) by comment id
export const GetCommentPlain: Sync = (
  { request, comment, comments },
) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/_getComment", comment }, {
      request,
    }],
  ),
  where: async (frames) => {
    return await frames.query(
      async ({ comment: c }) => {
        const res = await Commenting._getComment({ comment: c as ID });
        const arr = "comments" in res ? res.comments : [];
        return [{ comments: arr }];
      },
      { comment },
      { comments },
    );
  },
  then: actions([Requesting.respond, { request, comments }]),
});

// Single comment fetch by commentId alias
export const GetCommentByCommentIdPlain: Sync = (
  { request, commentId, comments },
) => ({
  when: actions(
    [Requesting.request, { path: "/Commenting/_getComment", commentId }, {
      request,
    }],
  ),
  where: async (frames) => {
    return await frames.query(
      async ({ commentId: c }) => {
        const res = await Commenting._getComment({ comment: c as ID });
        const arr = "comments" in res ? res.comments : [];
        return [{ comments: arr }];
      },
      { commentId },
      { comments },
    );
  },
  then: actions([Requesting.respond, { request, comments }]),
});

// Posting: _getPostsByAuthor by authorUsername param (explicit username field)
export const GetPostsByAuthorByAuthorUsernamePlain: Sync = (
  { request, authorUsername, user, posts },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/Posting/_getPostsByAuthor", authorUsername },
      { request },
    ],
  ),
  where: async (frames) => {
    // Resolve username -> user id, then fetch posts by author
    frames = await frames.query(
      async ({ authorUsername: un }) => {
        const docs = await PasswordAuthentication._getUserByUsername(un);
        return docs.map(({ _id }) => ({ user: _id as ID }));
      },
      { authorUsername },
      { user },
    );
    if (frames.length === 0) return frames;
    return await frames.query(
      async ({ user: u }) => {
        const { posts } = await Posting._getPostsByAuthor({ user: u });
        const safePosts = Array.isArray(posts) ? posts : [];
        return [{ posts: safePosts }];
      },
      { user },
      { posts },
    );
  },
  then: actions([Requesting.respond, { request, posts }]),
});

// ========================= SessionLogging (additional plain path query) =========================
// Plain path variant for _getEntriesInSession when frontend supplies username as `user` and session id as `session`.
// This sync resolves the username -> user id, authorizes ownership of the session, fetches entries, and responds.
// It always responds (empty entries array) even if user/session not found to avoid timeouts.
export const GetEntriesInSessionPlain: Sync = (
  { request, user, session, sessionDetails, entries },
) => ({
  when: actions([
    Requesting.request,
    { path: "/SessionLogging/_getEntriesInSession", user, session },
    { request },
  ]),
  where: async (frames) => {
    // 1. Fetch session details to verify ownership
    const detailFrames = await frames.query(
      SessionLogging._getSessionDetails,
      { session },
      { sessionDetails },
    );
    if (detailFrames.length === 0) {
      return await frames.query(() => [{ entries: [] }], {}, { entries });
    }
    // 2. Authorize: owner must equal provided user (ID) OR the ID resolved from provided username
    const allowed: typeof detailFrames = [] as unknown as typeof detailFrames;
    for (let i = 0; i < detailFrames.length; i++) {
      const f = detailFrames[i] as Record<symbol, unknown>;
      const sd = f[sessionDetails] as unknown as { owner?: ID } | undefined;
      if (!sd || !sd.owner) continue;
      const owner: ID = sd.owner as ID;
      // Direct ID match
      if (owner === (user as unknown as ID)) {
        allowed.push(detailFrames[i]);
        continue;
      }
      // Username fallback: resolve provided user (possibly username) to ID and compare
      const resolved = await PasswordAuthentication._getUserByUsernameForSync({
        username: user as unknown as ID,
      });
      const rid = Array.isArray(resolved) && resolved[0]
        ? (resolved[0] as unknown as Record<string, unknown>).toUserId as ID
        : undefined;
      if (rid && rid === owner) {
        allowed.push(detailFrames[i]);
      }
    }
    if (allowed.length === 0) {
      return await detailFrames.query(() => [{ entries: [] }], {}, { entries });
    }
    // 3. Fetch entries for session (on allowed frames)
    frames = await (allowed as typeof frames).query(
      SessionLogging._getEntriesInSession,
      { session },
      { entries },
    );
    if (frames.length === 0) {
      return await frames.query(() => [{ entries: [] }], {}, { entries });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, entries }]),
});

// ========================= File (additional plain path confirmUpload variants) =========================
// Plain path variant for confirmUpload when frontend supplies username as `user` and object path as `object`.
// Ensures we respond even if username resolution fails, to prevent timeouts.
export const ConfirmUploadPlainRequest: Sync = (
  { request, user, object, contentType, size },
) => ({
  when: actions(
    [Requesting.request, {
      path: "/File/confirmUpload",
      user,
      object,
      contentType,
      size,
    }, { request }],
  ),
  then: actions([
    File.confirmUpload,
    { user, object, contentType, size },
  ]),
});

export const ConfirmUploadPlainResponse: Sync = (
  { request, file, url },
) => ({
  when: actions(
    [Requesting.request, { path: "/File/confirmUpload" }, { request }],
    [File.confirmUpload, {}, { file, url }],
  ),
  then: actions([Requesting.respond, { request, file, url }]),
});

export const ConfirmUploadPlainError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/File/confirmUpload" }, { request }],
    [File.confirmUpload, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
