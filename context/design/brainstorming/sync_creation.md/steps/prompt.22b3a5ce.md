---
timestamp: 'Thu Nov 06 2025 03:55:04 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_035504.e1a865af.md]]'
content_id: 22b3a5ce5810862c25c434b1e2abc058d5cce552a81902dc0a0682acd15a8a77
---

# prompt: I am brainstorming syncs among my concepts. I have developed a brainstormed list but would like help refining / adding / deleting syncs as necessary.

Here is some additional context:

"Why exclude actions? Excluding a concept action means that calling /api/concept\_c/action\_a no longer directly causes Concept\_c.action\_a to occur. There are primarily two reasons for wanting this. One is that the action should only be permitted under certain conditions (such as when the user has been authenticated); you would implement this with a sync saying that when the request occurs and where some condition holds, then the action itself occurs. Note that in this case the call to /api/concept\_c/action\_a would likely have to be modified because the request action would include parameters (such as a session token) that the bare concept action does not."

Here is my brainstormed list:

* Every concept is closely tied to the PasswordAuthentication concept. The other concepts' actions are tied to a user, and that user must be authenticated to do anything.
* SessionLogging.endSession should instigate Posting.create
* Commenting.addComment should confirm that a post actually exists before making the comment
* When adding a friend, the friend must exist
