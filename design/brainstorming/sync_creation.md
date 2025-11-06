[@CommentingConcept](../../src/concepts/Commenting/CommentingConcept.ts)
[@FileConcept](../../src/concepts/File/FileConcept.ts)
[@FriendingConcept](../../src/concepts/Friending/FriendingConcept.ts)
[@PasswordAuthenticationConcept](../../src/concepts/PasswordAuthentication/PasswordAuthenticationConcept.ts)
[@PostingConcept](../../src/concepts/Posting/PostingConcept.ts)
[@SessionLoggingConcept](../../src/concepts/SessionLogging/SessionLoggingConcept.ts)

# prompt: I am brainstorming syncs among my concepts. I have developed a brainstormed list but would like help refining / adding / deleting syncs as necessary. I would also like help defining which actions should be included vs excluded in Requesting/passthrough.ts.

Here are my unverified routes:

WARNING - UNVERIFIED ROUTE: /api/Commenting/addComment
WARNING - UNVERIFIED ROUTE: /api/Commenting/deleteComment
WARNING - UNVERIFIED ROUTE: /api/Commenting/editComment
WARNING - UNVERIFIED ROUTE: /api/Commenting/_getComment
WARNING - UNVERIFIED ROUTE: /api/Commenting/_getCommentsForPost
WARNING - UNVERIFIED ROUTE: /api/Commenting/_getCommentsByAuthor
WARNING - UNVERIFIED ROUTE: /api/File/requireBucket
WARNING - UNVERIFIED ROUTE: /api/File/safeName
WARNING - UNVERIFIED ROUTE: /api/File/requestUploadUrl
WARNING - UNVERIFIED ROUTE: /api/File/confirmUpload
WARNING - UNVERIFIED ROUTE: /api/File/getViewUrl
WARNING - UNVERIFIED ROUTE: /api/File/_getFileById
WARNING - UNVERIFIED ROUTE: /api/File/_getFilesByOwner
WARNING - UNVERIFIED ROUTE: /api/Friending/getCanonicalFriendPair
WARNING - UNVERIFIED ROUTE: /api/Friending/sendRequest
WARNING - UNVERIFIED ROUTE: /api/Friending/acceptRequest
WARNING - UNVERIFIED ROUTE: /api/Friending/denyRequest
WARNING - UNVERIFIED ROUTE: /api/Friending/removeFriend
WARNING - UNVERIFIED ROUTE: /api/Friending/_isFriends
WARNING - UNVERIFIED ROUTE: /api/Friending/_getFriends
WARNING - UNVERIFIED ROUTE: /api/Friending/_getSentFriendRequests
WARNING - UNVERIFIED ROUTE: /api/Friending/_getReceivedFriendRequests
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/register
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/authenticate
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/_getUserByUsername
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/_getUserById
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/_getAllUsers
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/_userExistsById
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/_userExistsByUsername
WARNING - UNVERIFIED ROUTE: /api/Posting/create
WARNING - UNVERIFIED ROUTE: /api/Posting/delete
WARNING - UNVERIFIED ROUTE: /api/Posting/edit
WARNING - UNVERIFIED ROUTE: /api/Posting/_getPostById
WARNING - UNVERIFIED ROUTE: /api/Posting/_getPostsByAuthor
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/startSession
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/addEntry
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/endSession
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/_getSessionsByUser
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/_getSessionDetails
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/_getEntriesInSession
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/_isSessionActive

Here is some additional context:

"Why exclude actions? Excluding a concept action means that calling /api/concept_c/action_a no longer directly causes Concept_c.action_a to occur. There are primarily two reasons for wanting this. One is that the action should only be permitted under certain conditions (such as when the user has been authenticated); you would implement this with a sync saying that when the request occurs and where some condition holds, then the action itself occurs. Note that in this case the call to /api/concept_c/action_a would likely have to be modified because the request action would include parameters (such as a session token) that the bare concept action does not."

Here is my brainstormed list:

- Every concept is closely tied to the PasswordAuthentication concept. The other concepts' actions are tied to a user, and that user must be authenticated to do anything.
- Commenting.addComment should confirm that a post actually exists before making the comment and confirm post visibility by checking if that post is among their own posts or among one of their friends' posts
- When adding a friend, the friend must exist and not already be a friend
- If a post is deleted, then all comments under that post should be deleted too
# response:

Excellent! This is a fantastic and systematic way to think about the interactions in your application. The concept of "syncs" as the connective tissue between isolated concepts is a powerful architectural pattern. Let's refine your brainstormed list and categorize your API routes.

### Summary of the Goal

Your goal is to determine:
1.  **Which API routes should be "passthrough"?** These are actions that can be called directly without any special conditions, typically for unauthenticated users (e.g., `register`, `authenticate`).
2.  **Which API routes should be "excluded"?** These actions require an intermediary "sync" to run checks first. These checks almost always involve:
    *   **Authentication:** Is the user logged in? (via `SessionLogging`)
    *   **Authorization:** Does this logged-in user have permission to perform this action on this specific data? (e.g., "Can you delete a comment you didn't write?")
    *   **Data Integrity/Validation:** Does the related data exist? (e.g., "Does the post you're commenting on exist?")
3.  **What should the syncs themselves do?** We'll expand on your brainstormed list.

---

### Part 1: Refining and Expanding Your Sync Brainstorm

Your initial list is a great start. Let's build on it, making the logic more explicit.

#### **Existing Syncs (Refined)**

1.  **System-Wide Authentication Wrapper:**
    *   **Name:** `AuthenticatedAction`
    *   **Trigger:** Any request to an excluded route (e.g., `/api/Commenting/addComment`).
    *   **Logic:**
        *   **WHEN** a request is made to an excluded route with a `sessionToken`.
        *   **IF** `SessionLogging._isSessionActive(sessionToken)` is **true** and returns a `userId`.
        *   **THEN** proceed with the specific authorization sync for that action, passing the `userId` along.
        *   **ELSE** return an "Authentication Failed" error.
    *   **Purpose:** This is a foundational, reusable sync that gates almost every other action.

2.  **Commenting on a Post:**
    *   **Name:** `onAddCommentRequest`
    *   **Trigger:** A request to `/api/Commenting/addComment`.
    *   **Logic (assumes authentication already passed):**
        *   **WHEN** `Requesting.addComment({ userId, content, postId })` occurs.
        *   **IF** `Posting._getPostById({ _id: postId })` returns a valid post.
        *   **AND IF** the post's author is `userId` **OR** `Friending._isFriends({ user1: userId, user2: post.author })` is true.
        *   **THEN** call `Commenting.addComment({ author: userId, content, post: postId })`.
        *   **ELSE** return a "Post not found or you don't have permission to view it" error.

3.  **Sending a Friend Request:**
    *   **Name:** `onSendFriendRequest`
    *   **Trigger:** A request to `/api/Friending/sendRequest`.
    *   **Logic (assumes authentication passed):**
        *   **WHEN** `Requesting.sendRequest({ fromUserId, toUsername })` occurs.
        *   **IF** `PasswordAuthentication._getUserByUsername({ username: toUsername })` returns a `toUser`.
        *   **AND IF** `fromUserId` is not equal to `toUser._id`.
        *   **AND IF** `Friending._isFriends({ user1: fromUserId, user2: toUser._id })` is **false**.
        *   **AND IF** there is no pending request between them already.
        *   **THEN** call `Friending.sendRequest({ from: fromUserId, to: toUser._id })`.
        *   **ELSE** return an appropriate error ("User not found", "You cannot friend yourself", "You are already friends", etc.).

4.  **Cascading Deletion: Post -> Comments:**
    *   **Name:** `onPostDeleted`
    *   **Trigger:** The successful completion of a `Posting.delete()` action.
    *   **Logic:**
        *   **WHEN** `Posting.delete()` successfully deletes `postId`.
        *   **THEN** get all comments for that post via `Commenting._getCommentsForPost({ post: postId })`.
        *   **AND THEN** for each `comment` in the results, call `Commenting.deleteComment({ user: comment.author, comment: comment._id })`.
        *   **Note:** This reveals a potential issue. `deleteComment` requires the *author* of the comment. A better approach might be to add a new, internal-only method like `_deleteAllCommentsForPost(postId)` to the `CommentingConcept` that bypasses the author check, and have the sync call that instead. This is a great example of how syncs inform concept design.

#### **New Syncs to Consider**

5.  **Cascading Deletion: User -> All Content:**
    *   **Name:** `onUserDeleted`
    *   **Trigger:** A user account is deleted (you'll need a `PasswordAuthentication.deleteUser` action for this).
    *   **Logic:** This is a complex but crucial sync for data integrity.
        *   **WHEN** a `userId` is deleted.
        *   **THEN:**
            *   Delete all their posts (`Posting._getPostsByAuthor` -> `Posting.delete`).
            *   Delete all their comments (`Commenting._getCommentsByAuthor` -> `Commenting.deleteComment`).
            *   Delete all their files (`File._getFilesByOwner` -> `File.delete`).
            *   Cancel their sent friend requests.
            *   Remove all their friendships (`Friending._getFriends` -> `Friending.removeFriend`).
            *   End all their sessions (`SessionLogging._getSessionsByUser` -> `SessionLogging.endSession`).

6.  **Authorization for Deletes/Edits:**
    *   **Name:** `onEditCommentRequest` / `onDeletePostRequest` etc.
    *   **Trigger:** Requests to `/api/Commenting/editComment`, `/api/Posting/delete`, etc.
    *   **Logic (assumes authentication passed):**
        *   **WHEN** `Requesting.editComment({ userId, commentId, new_content })` occurs.
        *   **IF** `Commenting._getComment({ comment: commentId })` returns a comment.
        *   **AND IF** that comment's `author` is `userId`.
        *   **THEN** call `Commenting.editComment({ user: userId, comment: commentId, new_content })`.
        *   **ELSE** return a "Comment not found or you are not the author" error.
    *   **Principle:** The pattern is the same for all edit/delete actions: fetch the object, check ownership against the `userId` from the session, then proceed.

---

### Part 2: Defining `Requesting/passthrough.ts` Actions

Here is the breakdown of which actions should be included (passthrough) versus excluded (controlled by syncs).

#### ✅ **Actions to INCLUDE (Passthrough)**

These are the public entry points to your application that do not require a user to be logged in.

*   `/api/PasswordAuthentication/register`
    *   **Justification:** A new user cannot be authenticated, so this must be a public endpoint. The action itself creates the user identity.
*   `/api/PasswordAuthentication/authenticate`
    *   **Justification:** This is the action a user takes to *become* authenticated. It takes credentials (unauthenticated state) and produces a session (authenticated state).

#### ❌ **Actions to EXCLUDE (Control via Syncs)**

All other actions should be excluded because they either modify data, access private data, or rely on the identity of a logged-in user.

**Authentication/Session**
*   `/api/PasswordAuthentication/_getUserByUsername`, `_getUserById`, `_getAllUsers`, `_userExistsById`, `_userExistsByUsername`
    *   **Justification:** Exposing these directly could leak user data or allow for user enumeration attacks. A sync should control access, perhaps only allowing a user to get their *own* data or sanitized data for public profiles.
*   `/api/SessionLogging/endSession`, `_isSessionActive`, etc.
    *   **Justification:** These actions are intrinsically tied to an authenticated session and should be controlled by syncs that verify the session token.

**Friending**
*   All routes: `/api/Friending/sendRequest`, `acceptRequest`, `denyRequest`, `removeFriend`, `_isFriends`, `_getFriends`, `_getSentFriendRequests`, `_getReceivedFriendRequests`
    *   **Justification:** All friending actions require an authenticated user (`user1`) acting upon another user (`user2`). The sync must provide `user1` from the session and perform authorization and validation checks (e.g., you can't accept a request for someone else).

**Posting**
*   All routes: `/api/Posting/create`, `delete`, `edit`, `_getPostById`, `_getPostsByAuthor`
    *   **Justification:** Creating, editing, and deleting posts requires an authenticated author. Getting posts, even by ID or author, may be subject to visibility rules (e.g., friends-only posts), which must be handled by a sync.

**Commenting**
*   All routes: `/api/Commenting/addComment`, `deleteComment`, `editComment`, `_getComment`, `_getCommentsForPost`, `_getCommentsByAuthor`
    *   **Justification:** Same as Posting. All actions require an authenticated user and are subject to authorization (you can only edit/delete your own comments) and visibility rules (you can only comment on/view comments on posts you can see).

**File**
*   All routes: `/api/File/...`
    *   **Justification:** File management is always user-specific. An authenticated user must be identified to know whose files to upload, confirm, or view. Syncs are required to manage ownership and permissions.