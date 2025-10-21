[@api-extraction](api-extraction-from-code.md)

# prompt: Please extract an API for this app from the following five concepts:

## PasswordAuthentication

Specification:

[@PasswordAuthentication](../concepts/PasswordAuthentication/PasswordAuthentication.md)

Code:

[@PasswordAuthentication.ts](../../src/concepts/PasswordAuthentication/PasswordAuthenticationConcept.ts)

## Commenting

Specification:

[@Commenting](../concepts/Commenting/Commenting.md)

Code:

[@Commenting.ts](../../src/concepts/Commenting/CommentingConcept.ts)

## Posting

Specification:

[@Posting](../concepts/Posting/Posting.md)

Code:

[@Posting.ts](../../src/concepts/Posting/PostingConcept.ts)

## Friending

Specification:

[@Friending](../concepts/Friending/Friending.md)

Code:

[@Friending.ts](../../src/concepts/Friending/FriendingConcept.ts)

## SessionLogging

Specification:

[@SessionLogging](../concepts/SessionLogging/SessionLogging.md)

Code:

[@SessionLogging.ts](../../src/concepts/SessionLogging/SessionLoggingConcept.ts)
# response:

# API Specification: PasswordAuthentication Concept

**Purpose:** limit access to known users

---

## API Endpoints

### POST /api/PasswordAuthentication/register

**Description:** Registers a new user with a unique username and password.

**Requirements:**
- username to not already exist in the set of Users

**Effects:**
- creates a new user of that username and password
- adds that user to the set of users
- returns the new user

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "user": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PasswordAuthentication/authenticate

**Description:** Authenticates a user with the provided username and password.

**Requirements:**
- user of the argument username and password to exist in the set of Users

**Effects:**
- returns the corresponding User

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "user": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PasswordAuthentication/_getUserByUsername

**Description:** Retrieves a user's full document by their username.

**Requirements:**
- (Implicit: username argument must be provided)

**Effects:**
- returns an array containing the user document if found, otherwise an empty array.

**Request Body:**
```json
{
  "username": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "user": {
      "_id": "string",
      "username": "string",
      "password": "string"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PasswordAuthentication/_getUserById

**Description:** Retrieves a user's full document by their ID.

**Requirements:**
- (Implicit: id argument must be provided)

**Effects:**
- returns an array containing the user document if found, otherwise an empty array.

**Request Body:**
```json
{
  "id": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "user": {
      "_id": "string",
      "username": "string",
      "password": "string"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PasswordAuthentication/_getAllUsers

**Description:** Retrieves all user documents in the system.

**Requirements:**
- true

**Effects:**
- returns an array of all user documents.

**Request Body:**
```json
{}
```

**Success Response Body (Query):**
```json
[
  {
    "user": {
      "_id": "string",
      "username": "string",
      "password": "string"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PasswordAuthentication/_userExistsById

**Description:** Checks if a user with the given ID exists.

**Requirements:**
- true

**Effects:**
- returns `[true]` if a user with the given ID exists, otherwise `[]`

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "exists": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PasswordAuthentication/_userExistsByUsername

**Description:** Checks if a user with the given username exists.

**Requirements:**
- true

**Effects:**
- returns `[true]` if a user with the given username exists, otherwise `[]`

**Request Body:**
```json
{
  "username": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "exists": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

# API Specification: Commenting Concept

**Purpose:** enable discussion around shared posts

---

## API Endpoints

### POST /api/Commenting/addComment

**Description:** Creates a new comment authored by a user under a specific post.

**Requirements:**
- author and post must exist (implicitly handled by syncs providing valid IDs)
- author must have visibility of the post (implicitly handled by syncs)
- content cannot be empty

**Effects:**
- creates a comment authored by the user under the post with the text content

**Request Body:**
```json
{
  "author": "string",
  "content": "string",
  "post": "string"
}
```

**Success Response Body (Action):**
```json
{
  "comment": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Commenting/deleteComment

**Description:** Deletes a comment if the requesting user is its author.

**Requirements:**
- comment must exist
- comment must belong to the user

**Effects:**
- deletes the comment

**Request Body:**
```json
{
  "user": "string",
  "comment": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Commenting/editComment

**Description:** Edits the content of an existing comment if the requesting user is its author.

**Requirements:**
- comment must exist
- comment must belong to the user
- new_content cannot be empty

**Effects:**
- edits the comment content to be that of new_content

**Request Body:**
```json
{
  "user": "string",
  "comment": "string",
  "new_content": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Commenting/_getComment

**Description:** Retrieves the full details of a specific comment by its ID.

**Requirements:**
- (Implicit: comment ID must be provided)

**Effects:**
- Query to retrieve a specific comment. Returns an array for consistency with other queries.

**Request Body:**
```json
{
  "comment": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "comment": {
      "_id": "string",
      "author": "string",
      "content": "string",
      "post": "string",
      "createdAt": "date-time"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Commenting/_getCommentsForPost

**Description:** Retrieves all comments associated with a given post, sorted from most recent to oldest.

**Requirements:**
- (Implicit: post ID must be provided)

**Effects:**
- Query to retrieve all comments for a given post, sorted from most recent to oldest.

**Request Body:**
```json
{
  "post": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "comment": {
      "_id": "string",
      "author": "string",
      "content": "string",
      "post": "string",
      "createdAt": "date-time"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Commenting/_getCommentsByAuthor

**Description:** Retrieves all comments made by a specific user, sorted from most recent to oldest.

**Requirements:**
- (Implicit: author ID must be provided)

**Effects:**
- Query to retrieve all comments made by a given user, sorted from most recent to oldest.

**Request Body:**
```json
{
  "author": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "comment": {
      "_id": "string",
      "author": "string",
      "content": "string",
      "post": "string",
      "createdAt": "date-time"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

# API Specification: Posting Concept

**Purpose:** allow users to publish and share content for others to see

---

## API Endpoints

### POST /api/Posting/create

**Description:** Creates a new post authored by a user, including a caption and at least one image.

**Requirements:**
- user to exist
- images cannot be empty

**Effects:**
- creates a new post authored by the user with its content being the caption and images given.

**Request Body:**
```json
{
  "user": "string",
  "images": [
    "string"
  ],
  "caption": "string"
}
```

**Success Response Body (Action):**
```json
{
  "post": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Posting/delete

**Description:** Deletes a post if the requesting user is its author.

**Requirements:**
- user to exist
- post to exist and belong to user

**Effects:**
- deletes the post.

**Request Body:**
```json
{
  "user": "string",
  "post": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Posting/edit

**Description:** Edits the caption of an existing post if the requesting user is its author.

**Requirements:**
- user to exist
- post to exist and belong to user

**Effects:**
- edits the caption of the post to be that of the new one.

**Request Body:**
```json
{
  "user": "string",
  "post": "string",
  "new_caption": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Posting/_getPostById

**Description:** Retrieves the full details of a specific post by its ID.

**Requirements:**
- (Implicit: post ID must be provided)

**Effects:**
- Returns the details of a specific post as an array.

**Request Body:**
```json
{
  "post": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "postDetails": {
      "_id": "string",
      "caption": "string",
      "images": [
        "string"
      ],
      "author": "string",
      "createdAt": "date-time"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Posting/_getPostsByAuthor

**Description:** Retrieves all posts authored by a specific user, sorted from most recent to oldest.

**Requirements:**
- (Implicit: user ID must be provided)

**Effects:**
- Returns all posts authored by a specific user from most recent to oldest.

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "post": {
      "_id": "string",
      "caption": "string",
      "images": [
        "string"
      ],
      "author": "string",
      "createdAt": "date-time"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

# API Specification: Friending Concept

**Purpose:** allow users to add each other as friends to share information with

---

## API Endpoints

### POST /api/Friending/sendRequest

**Description:** Sends a friend request from one user to another.

**Requirements:**
- sender is not the receiver
- friend request from sender to receiver or vice versa does not already exist
- friendship between sender and receiver does not already exist

**Effects:**
- creates a new friend request from sender to receiver
- returns the new request's ID

**Request Body:**
```json
{
  "sender": "string",
  "receiver": "string"
}
```

**Success Response Body (Action):**
```json
{
  "request": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Friending/acceptRequest

**Description:** Accepts an existing friend request, creating a friendship.

**Requirements:**
- request from sender to receiver to exist

**Effects:**
- removes friend request
- records friendship between sender and user

**Request Body:**
```json
{
  "sender": "string",
  "receiver": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Friending/denyRequest

**Description:** Denies an existing friend request.

**Requirements:**
- request from sender to receiver to exist

**Effects:**
- removes friend request

**Request Body:**
```json
{
  "sender": "string",
  "receiver": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Friending/removeFriend

**Description:** Removes an existing friendship between two users.

**Requirements:**
- friendship between user and to_be_removed_friend must exist

**Effects:**
- removes friendship between user and to_be_removed_friend

**Request Body:**
```json
{
  "user": "string",
  "to_be_removed_friend": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Friending/_isFriends

**Description:** Checks if two users are friends.

**Requirements:**
- user1 and user2 are valid User IDs (implicit, as concept doesn't manage User existence)

**Effects:**
- returns an object with an 'areFriends' field containing an array with a single boolean indicating if users are friends

**Request Body:**
```json
{
  "user1": "string",
  "user2": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "areFriends": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Friending/_getFriends

**Description:** Retrieves a list of all friends for a given user.

**Requirements:**
- user is a valid User ID (implicit)

**Effects:**
- returns an object with a 'friends' field containing an array of User IDs that are friends with the specified user

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "friends": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Friending/_getSentFriendRequests

**Description:** Retrieves a list of users to whom the sender has sent friend requests.

**Requirements:**
- sender is a valid User ID (implicit)

**Effects:**
- returns an object with a 'sentRequests' field containing an array of User IDs to whom the sender has sent requests

**Request Body:**
```json
{
  "sender": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "sentRequests": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Friending/_getReceivedFriendRequests

**Description:** Retrieves a list of users who have sent friend requests to the receiver.

**Requirements:**
- receiver is a valid User ID (implicit)

**Effects:**
- returns an object with a 'receivedRequests' field containing an array of User IDs who have sent requests to the receiver

**Request Body:**
```json
{
  "receiver": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "receivedRequests": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

# API Specification: SessionLogging Concept

**Purpose:** capture photo records of a user's activity during a trip session

---

## API Endpoints

### POST /api/SessionLogging/startSession

**Description:** Creates a new session (active = true) under the specified user.

**Requirements:**
- user to exist (as a valid ID in the system context)

**Effects:**
- creates a new session (active = true) under the specified user, returning the ID of the new session.

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body (Action):**
```json
{
  "session": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/SessionLogging/addEntry

**Description:** Adds the specified image to the set of images associated with an active session owned by the user.

**Requirements:**
- user to exist
- session must exist
- image must exist (as a valid ID)
- session must be active
- session must belong to the user
- The image must not already be associated with the session.

**Effects:**
- adds the specified image to the set of images associated with the session.

**Request Body:**
```json
{
  "user": "string",
  "session": "string",
  "image": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/SessionLogging/endSession

**Description:** Sets the 'active' flag of the specified session to false.

**Requirements:**
- user to exist
- session must exist
- session must belong to the user
- Session must be active

**Effects:**
- sets the 'active' flag of the specified session to false.

**Request Body:**
```json
{
  "user": "string",
  "session": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/SessionLogging/_getSessionsByUser

**Description:** Returns a list of IDs for all sessions owned by the given user.

**Requirements:**
- (Implicit: user ID must be provided)

**Effects:**
- Returns a list of IDs for all sessions owned by the given user.

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "sessions": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/SessionLogging/_getSessionDetails

**Description:** Returns the full details of a specific session, or an empty array if not found.

**Requirements:**
- (Implicit: session ID must be provided)

**Effects:**
- Returns an array containing the full details of a specific session, or an empty array if not found.

**Request Body:**
```json
{
  "session": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "details": {
      "_id": "string",
      "owner": "string",
      "images": [
        "string"
      ],
      "active": "boolean"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/SessionLogging/_getEntriesInSession

**Description:** Returns the list of image entry IDs for a given session.

**Requirements:**
- (Implicit: session ID must be provided)

**Effects:**
- Returns the list of image entry IDs for a given session.

**Request Body:**
```json
{
  "session": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "images": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/SessionLogging/_isSessionActive

**Description:** Returns whether the specified session is active.

**Requirements:**
- (Implicit: session ID must be provided)

**Effects:**
- Returns an array containing a single boolean (true if the session is active, false if inactive) or an empty array if the session is not found.

**Request Body:**
```json
{
  "session": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "active": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---