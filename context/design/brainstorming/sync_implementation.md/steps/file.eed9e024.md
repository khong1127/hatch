---
timestamp: 'Thu Nov 06 2025 06:52:57 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_065257.588e7e63.md]]'
content_id: eed9e0242675a2499917f4de028dea1a5bd63e38030b64974da17060d2bd4f43
---

# file: src/concepts/Requesting/passthrough.ts

```typescript
/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // Feel free to delete these example inclusions
  // "/api/LikertSurvey/_getSurveyQuestions": "this is a public query",
  // "/api/LikertSurvey/_getSurveyResponses": "responses are public",
  // "/api/LikertSurvey/_getRespondentAnswers": "answers are visible",
  // "/api/LikertSurvey/submitResponse": "allow anyone to submit response",
  // "/api/LikertSurvey/updateResponse": "allow anyone to update their response",
  "/api/PasswordAuthentication/register":
    "a new user cannot be authenticated, so it should be public",
  "/api/PasswordAuthentication/authenticate":
    "this turns credentials into an authenticated session",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // Feel free to delete these example exclusions
  // "/api/LikertSurvey/createSurvey",
  // "/api/LikertSurvey/addQuestion",

  // PasswordAuthentication
  "/api/PasswordAuthentication/_getUserByUsername",
  "/api/PasswordAuthentication/_getUserById",
  "/api/PasswordAuthentication/_getAllUsers",
  "/api/PasswordAuthentication/_userExistsById",
  "/api/PasswordAuthentication/_userExistsByUsername",

  // SessionLogging
  "/api/SessionLogging/startSession",
  "/api/SessionLogging/addEntry",
  "/api/SessionLogging/endSession",
  "/api/SessionLogging/_getSessionsByUser",
  "/api/SessionLogging/_getSessionDetails",
  "/api/SessionLogging/_getEntriesInSession",
  "/api/SessionLogging/_isSessionActive",

  // Friending
  "/api/Friending/sendRequest",
  "/api/Friending/acceptRequest",
  "/api/Friending/denyRequest",
  "/api/Friending/removeFriend",
  "/api/Friending/_isFriends",
  "/api/Friending/_getFriends",
  "/api/Friending/_getSentFriendRequests",
  "/api/Friending/_getReceivedFriendRequests",
  "/api/Friending/getCanonicalFriendPair",

  // Posting
  "/api/Posting/create",
  "/api/Posting/delete",
  "/api/Posting/edit",
  "/api/Posting/_getPostById",
  "/api/Posting/_getPostsByAuthor",

  // Commenting
  "/api/Commenting/addComment",
  "/api/Commenting/deleteComment",
  "/api/Commenting/editComment",
  "/api/Commenting/_getComment",
  "/api/Commenting/_getCommentsForPost",
  "/api/Commenting/_getCommentsByAuthor",
  "/api/Commenting/deleteAllCommentsForPost",

  // File
  "/api/File/requireBucket",
  "/api/File/safeName",
  "/api/File/requestUploadUrl",
  "/api/File/confirmUpload",
  "/api/File/getViewUrl",
  "/api/File/_getFileById",
  "/api/File/_getFilesByOwner",
];

```
