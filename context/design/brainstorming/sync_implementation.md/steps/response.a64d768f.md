---
timestamp: 'Thu Nov 06 2025 06:49:55 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_064955.ff306b51.md]]'
content_id: a64d768fbd8f6bc3fcee6e0fc7087ce88780fa459e94ffcc7badc3f9476ff4cc
---

# response:

Of course. Based on your brainstorm and the provided documentation, I've generated a set of syncs that implement the required authentication, authorization, data integrity, and cascading logic for your `Commenting` concept. These syncs serve as the secure "connective tissue" between a raw API request and your core business logic.

I will create a new file, `src/syncs/commenting.sync.ts`, to house these new synchronizations.

***

### `src/syncs/commenting.sync.ts`

```typescript
import { actions, Sync, Frames } from "@engine";
import {
  Commenting,
  Friending,
  Posting,
  Requesting,
  SessionLogging,
} from "@concepts";

// =============================================================================
// Syncs for Adding Comments
// =============================================================================

/**
 * Handles a request to add a comment.
 * This sync first authenticates the user via their session. It then validates
 * that the post they are trying tocomment on actually exists. Finally, it
 * checks for visibility: the user can only comment if they are the author of
 * the post or are friends with the author.
 */
export const AddCommentRequest: Sync = (
  { request, session, user, post, content, postDoc, postAuthor, areFriends },
) => ({
  when: actions([
    Requesting.request,
    { path: "/api/Commenting/addComment", session, post, content },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate the user from the session token
    frames = await frames.query(SessionLogging._getUser, { session }, { user });

    // 2. Validate that the post exists
    frames = await frames.query(Posting._getPostById, { _id: post }, { postDoc });
    // If the query returns no frames, the post doesn't exist, and the sync stops.

    // 3. Authorize: Check if the user has permission to view (and thus comment on) the post.
    // We create two separate sets of frames and merge them to handle the OR condition:
    // "user is the author" OR "user is friends with the author".

    // Frames where the user is the author of the post
    const ownPostFrames = frames.filter(($) => $[postDoc].author === $[user]);

    // Frames where the user is NOT the author
    const otherPostFrames = frames.filter(($) => $[postDoc].author !== $[user]);
    if (otherPostFrames.length === 0) {
      return ownPostFrames; // No other posts to check, return what we have.
    }

    // For the other posts, enrich the frames with the author's ID
    const otherPostFramesWithAuthor = otherPostFrames.map((frame) => ({
      ...frame,
      [postAuthor]: frame[postDoc].author,
    }));
    
    // Now, query to see if the user and author are friends
    const friendPostFrames = await new Frames(...otherPostFramesWithAuthor)
        .query(Friending._isFriends, { user1: user, user2: postAuthor }, { areFriends });

    // Filter for the frames where they are indeed friends
    const visibleFriendPostFrames = friendPostFrames.filter(($) => $[areFriends]);
    
    // Return the combination of frames for the user's own posts and their friends' posts.
    return new Frames(...ownPostFrames, ...visibleFriendPostFrames);
  },
  then: actions([Commenting.addComment, { author: user, content, post }]),
});

/**
 * Responds to a successful comment creation.
 */
export const AddCommentResponse: Sync = ({ request, comment }) => ({
  when: actions(
    [Requesting.request, { path: "/api/Commenting/addComment" }, { request }],
    [Commenting.addComment, {}, { comment }],
  ),
  then: actions([Requesting.respond, { request, comment }]),
});

/**
 * Responds with an error if comment creation fails.
 */
export const AddCommentResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/api/Commenting/addComment" }, { request }],
    [Commenting.addComment, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
// Syncs for Deleting Comments
// =============================================================================

/**
 * Handles a request to delete a comment.
 * Authenticates the user and then authorizes the action by ensuring
 * the user is the author of the comment they are trying to delete.
 */
export const DeleteCommentRequest: Sync = (
  { request, session, user, comment, commentArr },
) => ({
  when: actions([
    Requesting.request,
    { path: "/api/Commenting/deleteComment", session, comment },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate the user
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    
    // 2. Get the comment document. The query returns an array.
    frames = await frames.query(Commenting._getComment, { comment }, { commentArr: "comments" });

    // 3. Filter out requests where the comment doesn't exist.
    frames = frames.filter(($) => $[commentArr] && $[commentArr].length > 0);

    // 4. Authorize: Ensure the authenticated user is the comment's author.
    return frames.filter(($) => $[commentArr][0].author === $[user]);
  },
  then: actions([Commenting.deleteComment, { user, comment }]),
});

/**
 * Responds after a successful comment deletion.
 */
export const DeleteCommentResponse: Sync = ({ request }) => ({
    when: actions(
      [Requesting.request, { path: "/api/Commenting/deleteComment" }, { request }],
      [Commenting.deleteComment, {}, {}], // Success is an empty object
    ),
    then: actions([Requesting.respond, { request, status: "deleted" }]),
});

/**
 * Responds with an error if comment deletion fails.
 */
export const DeleteCommentResponseError: Sync = ({ request, error }) => ({
    when: actions(
      [Requesting.request, { path: "/api/Commenting/deleteComment" }, { request }],
      [Commenting.deleteComment, {}, { error }],
    ),
    then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
// Syncs for Editing Comments
// =============================================================================

/**
 * Handles a request to edit a comment.
 * Authenticates the user and then authorizes the action by ensuring
 * the user is the author of the comment they are trying to edit.
 */
export const EditCommentRequest: Sync = (
  { request, session, user, comment, new_content, commentArr },
) => ({
  when: actions([
    Requesting.request,
    { path: "/api/Commenting/editComment", session, comment, new_content },
    { request },
  ]),
  where: async (frames) => {
    // 1. Authenticate the user
    frames = await frames.query(SessionLogging._getUser, { session }, { user });
    
    // 2. Get the comment document.
    frames = await frames.query(Commenting._getComment, { comment }, { commentArr: "comments" });
    
    // 3. Filter out requests where the comment doesn't exist.
    frames = frames.filter(($) => $[commentArr] && $[commentArr].length > 0);

    // 4. Authorize: Ensure the authenticated user is the comment's author.
    return frames.filter(($) => $[commentArr][0].author === $[user]);
  },
  then: actions([Commenting.editComment, { user, comment, new_content }]),
});

/**
 * Responds after a successful comment edit.
 */
export const EditCommentResponse: Sync = ({ request }) => ({
    when: actions(
      [Requesting.request, { path: "/api/Commenting/editComment" }, { request }],
      [Commenting.editComment, {}, {}],
    ),
    then: actions([Requesting.respond, { request, status: "edited" }]),
});

/**
 * Responds with an error if comment editing fails.
 */
export const EditCommentResponseError: Sync = ({ request, error }) => ({
    when: actions(
      [Requesting.request, { path: "/api/Commenting/editComment" }, { request }],
      [Commenting.editComment, {}, { error }],
    ),
    then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
// Syncs for System Integrity (Cascading Deletes)
// =============================================================================

/**
 * Implements the cascading delete logic from your brainstorm.
 * When a post is successfully deleted, this sync triggers and deletes all
 * comments associated with that post. This is a crucial sync for
 * maintaining data integrity.
 */
export const DeleteCommentsOnPostDelete: Sync = ({ post }) => ({
  when: actions(
    // This sync triggers off the CONCEPT action, not a request.
    [Posting.delete, { post }, { post }],
  ),
  then: actions(
    // This uses the internal method that doesn't require an author check.
    [Commenting.deleteAllCommentsForPost, { post }],
  ),
});
```
