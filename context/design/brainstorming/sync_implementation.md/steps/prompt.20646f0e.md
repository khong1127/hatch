---
timestamp: 'Thu Nov 06 2025 06:48:48 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_064848.6607a09b.md]]'
content_id: 20646f0e3112ff12e1c6519e4237093b4bdc73e7660e7afd06ce53578709fd90
---

# prompt: I am brainstorming syncs among my concepts. I have developed a brainstormed list but would like help refining / adding / deleting syncs as necessary. I would also like help defining which actions should be included vs excluded in Requesting/passthrough.ts.

Here are my unverified routes:

WARNING - UNVERIFIED ROUTE: /api/Commenting/addComment
WARNING - UNVERIFIED ROUTE: /api/Commenting/deleteComment
WARNING - UNVERIFIED ROUTE: /api/Commenting/editComment
WARNING - UNVERIFIED ROUTE: /api/Commenting/\_getComment
WARNING - UNVERIFIED ROUTE: /api/Commenting/\_getCommentsForPost
WARNING - UNVERIFIED ROUTE: /api/Commenting/\_getCommentsByAuthor
WARNING - UNVERIFIED ROUTE: /api/File/requireBucket
WARNING - UNVERIFIED ROUTE: /api/File/safeName
WARNING - UNVERIFIED ROUTE: /api/File/requestUploadUrl
WARNING - UNVERIFIED ROUTE: /api/File/confirmUpload
WARNING - UNVERIFIED ROUTE: /api/File/getViewUrl
WARNING - UNVERIFIED ROUTE: /api/File/\_getFileById
WARNING - UNVERIFIED ROUTE: /api/File/\_getFilesByOwner
WARNING - UNVERIFIED ROUTE: /api/Friending/getCanonicalFriendPair
WARNING - UNVERIFIED ROUTE: /api/Friending/sendRequest
WARNING - UNVERIFIED ROUTE: /api/Friending/acceptRequest
WARNING - UNVERIFIED ROUTE: /api/Friending/denyRequest
WARNING - UNVERIFIED ROUTE: /api/Friending/removeFriend
WARNING - UNVERIFIED ROUTE: /api/Friending/\_isFriends
WARNING - UNVERIFIED ROUTE: /api/Friending/\_getFriends
WARNING - UNVERIFIED ROUTE: /api/Friending/\_getSentFriendRequests
WARNING - UNVERIFIED ROUTE: /api/Friending/\_getReceivedFriendRequests
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/register
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/authenticate
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/\_getUserByUsername
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/\_getUserById
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/\_getAllUsers
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/\_userExistsById
WARNING - UNVERIFIED ROUTE: /api/PasswordAuthentication/\_userExistsByUsername
WARNING - UNVERIFIED ROUTE: /api/Posting/create
WARNING - UNVERIFIED ROUTE: /api/Posting/delete
WARNING - UNVERIFIED ROUTE: /api/Posting/edit
WARNING - UNVERIFIED ROUTE: /api/Posting/\_getPostById
WARNING - UNVERIFIED ROUTE: /api/Posting/\_getPostsByAuthor
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/startSession
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/addEntry
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/endSession
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/\_getSessionsByUser
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/\_getSessionDetails
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/\_getEntriesInSession
WARNING - UNVERIFIED ROUTE: /api/SessionLogging/\_isSessionActive

Here is some additional context:

"Why exclude actions? Excluding a concept action means that calling /api/concept\_c/action\_a no longer directly causes Concept\_c.action\_a to occur. There are primarily two reasons for wanting this. One is that the action should only be permitted under certain conditions (such as when the user has been authenticated); you would implement this with a sync saying that when the request occurs and where some condition holds, then the action itself occurs. Note that in this case the call to /api/concept\_c/action\_a would likely have to be modified because the request action would include parameters (such as a session token) that the bare concept action does not."

Here is my brainstormed list:

* Every concept is closely tied to the PasswordAuthentication concept. The other concepts' actions are tied to a user, and that user must be authenticated to do anything.
* Commenting.addComment should confirm that a post actually exists before making the comment and confirm post visibility by checking if that post is among their own posts or among one of their friends' posts
* When adding a friend, the friend must exist and not already be a friend
* If a post is deleted, then all comments under that post should be deleted too
