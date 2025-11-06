---
timestamp: 'Thu Nov 06 2025 04:02:42 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_040242.34ad8bab.md]]'
content_id: 4df065a38bcb8c0e41237b529f9fe18de68c79e78bd4f1816f7e0a1ddc34a77e
---

# response:

Excellent! This is a fantastic and systematic way to think about the interactions in your application. The concept of "syncs" as the connective tissue between isolated concepts is a powerful architectural pattern. Let's refine your brainstormed list and categorize your API routes.

### Summary of the Goal

Your goal is to determine:

1. **Which API routes should be "passthrough"?** These are actions that can be called directly without any special conditions, typically for unauthenticated users (e.g., `register`, `authenticate`).
2. **Which API routes should be "excluded"?** These actions require an intermediary "sync" to run checks first. These checks almost always involve:
   * **Authentication:** Is the user logged in? (via `SessionLogging`)
   * **Authorization:** Does this logged-in user have permission to perform this action on this specific data? (e.g., "Can you delete a comment you didn't write?")
   * **Data Integrity/Validation:** Does the related data exist? (e.g., "Does the post you're commenting on exist?")
3. **What should the syncs themselves do?** We'll expand on your brainstormed list.

***

### Part 1: Refining and Expanding Your Sync Brainstorm

Your initial list is a great start. Let's build on it, making the logic more explicit.

#### **Existing Syncs (Refined)**

1. **System-Wide Authentication Wrapper:**
   * **Name:** `AuthenticatedAction`
   * **Trigger:** Any request to an excluded route (e.g., `/api/Commenting/addComment`).
   * **Logic:**
     * **WHEN** a request is made to an excluded route with a `sessionToken`.
     * **IF** `SessionLogging._isSessionActive(sessionToken)` is **true** and returns a `userId`.
     * **THEN** proceed with the specific authorization sync for that action, passing the `userId` along.
     * **ELSE** return an "Authentication Failed" error.
   * **Purpose:** This is a foundational, reusable sync that gates almost every other action.

2. **Commenting on a Post:**
   * **Name:** `onAddCommentRequest`
   * **Trigger:** A request to `/api/Commenting/addComment`.
   * **Logic (assumes authentication already passed):**
     * **WHEN** `Requesting.addComment({ userId, content, postId })` occurs.
     * **IF** `Posting._getPostById({ _id: postId })` returns a valid post.
     * **AND IF** the post's author is `userId` **OR** `Friending._isFriends({ user1: userId, user2: post.author })` is true.
     * **THEN** call `Commenting.addComment({ author: userId, content, post: postId })`.
     * **ELSE** return a "Post not found or you don't have permission to view it" error.

3. **Sending a Friend Request:**
   * **Name:** `onSendFriendRequest`
   * **Trigger:** A request to `/api/Friending/sendRequest`.
   * **Logic (assumes authentication passed):**
     * **WHEN** `Requesting.sendRequest({ fromUserId, toUsername })` occurs.
     * **IF** `PasswordAuthentication._getUserByUsername({ username: toUsername })` returns a `toUser`.
     * **AND IF** `fromUserId` is not equal to `toUser._id`.
     * **AND IF** `Friending._isFriends({ user1: fromUserId, user2: toUser._id })` is **false**.
     * **AND IF** there is no pending request between them already.
     * **THEN** call `Friending.sendRequest({ from: fromUserId, to: toUser._id })`.
     * **ELSE** return an appropriate error ("User not found", "You cannot friend yourself", "You are already friends", etc.).

4. **Cascading Deletion: Post -> Comments:**
   * **Name:** `onPostDeleted`
   * **Trigger:** The successful completion of a `Posting.delete()` action.
   * **Logic:**
     * **WHEN** `Posting.delete()` successfully deletes `postId`.
     * **THEN** get all comments for that post via `Commenting._getCommentsForPost({ post: postId })`.
     * **AND THEN** for each `comment` in the results, call `Commenting.deleteComment({ user: comment.author, comment: comment._id })`.
     * **Note:** This reveals a potential issue. `deleteComment` requires the *author* of the comment. A better approach might be to add a new, internal-only method like `_deleteAllCommentsForPost(postId)` to the `CommentingConcept` that bypasses the author check, and have the sync call that instead. This is a great example of how syncs inform concept design.

#### **New Syncs to Consider**

5. **Cascading Deletion: User -> All Content:**
   * **Name:** `onUserDeleted`
   * **Trigger:** A user account is deleted (you'll need a `PasswordAuthentication.deleteUser` action for this).
   * **Logic:** This is a complex but crucial sync for data integrity.
     * **WHEN** a `userId` is deleted.
     * **THEN:**
       * Delete all their posts (`Posting._getPostsByAuthor` -> `Posting.delete`).
       * Delete all their comments (`Commenting._getCommentsByAuthor` -> `Commenting.deleteComment`).
       * Delete all their files (`File._getFilesByOwner` -> `File.delete`).
       * Cancel their sent friend requests.
       * Remove all their friendships (`Friending._getFriends` -> `Friending.removeFriend`).
       * End all their sessions (`SessionLogging._getSessionsByUser` -> `SessionLogging.endSession`).

6. **Authorization for Deletes/Edits:**
   * **Name:** `onEditCommentRequest` / `onDeletePostRequest` etc.
   * **Trigger:** Requests to `/api/Commenting/editComment`, `/api/Posting/delete`, etc.
   * **Logic (assumes authentication passed):**
     * **WHEN** `Requesting.editComment({ userId, commentId, new_content })` occurs.
     * **IF** `Commenting._getComment({ comment: commentId })` returns a comment.
     * **AND IF** that comment's `author` is `userId`.
     * **THEN** call `Commenting.editComment({ user: userId, comment: commentId, new_content })`.
     * **ELSE** return a "Comment not found or you are not the author" error.
   * **Principle:** The pattern is the same for all edit/delete actions: fetch the object, check ownership against the `userId` from the session, then proceed.

***

### Part 2: Defining `Requesting/passthrough.ts` Actions

Here is the breakdown of which actions should be included (passthrough) versus excluded (controlled by syncs).

#### ✅ **Actions to INCLUDE (Passthrough)**

These are the public entry points to your application that do not require a user to be logged in.

* `/api/PasswordAuthentication/register`
  * **Justification:** A new user cannot be authenticated, so this must be a public endpoint. The action itself creates the user identity.
* `/api/PasswordAuthentication/authenticate`
  * **Justification:** This is the action a user takes to *become* authenticated. It takes credentials (unauthenticated state) and produces a session (authenticated state).

#### ❌ **Actions to EXCLUDE (Control via Syncs)**

All other actions should be excluded because they either modify data, access private data, or rely on the identity of a logged-in user.

**Authentication/Session**

* `/api/PasswordAuthentication/_getUserByUsername`, `_getUserById`, `_getAllUsers`, `_userExistsById`, `_userExistsByUsername`
  * **Justification:** Exposing these directly could leak user data or allow for user enumeration attacks. A sync should control access, perhaps only allowing a user to get their *own* data or sanitized data for public profiles.
* `/api/SessionLogging/endSession`, `_isSessionActive`, etc.
  * **Justification:** These actions are intrinsically tied to an authenticated session and should be controlled by syncs that verify the session token.

**Friending**

* All routes: `/api/Friending/sendRequest`, `acceptRequest`, `denyRequest`, `removeFriend`, `_isFriends`, `_getFriends`, `_getSentFriendRequests`, `_getReceivedFriendRequests`
  * **Justification:** All friending actions require an authenticated user (`user1`) acting upon another user (`user2`). The sync must provide `user1` from the session and perform authorization and validation checks (e.g., you can't accept a request for someone else).

**Posting**

* All routes: `/api/Posting/create`, `delete`, `edit`, `_getPostById`, `_getPostsByAuthor`
  * **Justification:** Creating, editing, and deleting posts requires an authenticated author. Getting posts, even by ID or author, may be subject to visibility rules (e.g., friends-only posts), which must be handled by a sync.

**Commenting**

* All routes: `/api/Commenting/addComment`, `deleteComment`, `editComment`, `_getComment`, `_getCommentsForPost`, `_getCommentsByAuthor`
  * **Justification:** Same as Posting. All actions require an authenticated user and are subject to authorization (you can only edit/delete your own comments) and visibility rules (you can only comment on/view comments on posts you can see).

**File**

* All routes: `/api/File/...`
  * **Justification:** File management is always user-specific. An authenticated user must be identified to know whose files to upload, confirm, or view. Syncs are required to manage ownership and permissions.
