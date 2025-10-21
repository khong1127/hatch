---
timestamp: 'Mon Oct 20 2025 23:24:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_232416.2ad8532b.md]]'
content_id: 30867df415314320667e4a240c12e9a65515d4c06ce475f9948b28607048f496
---

# API Specification: Friending Concept

**Purpose:** allow users to add each other as friends to share information with

***

## API Endpoints

### POST /api/Friending/sendRequest

**Description:** Sends a friend request from one user to another.

**Requirements:**

* sender is not the receiver
* friend request from sender to receiver or vice versa does not already exist
* friendship between sender and receiver does not already exist

**Effects:**

* creates a new friend request from sender to receiver
* returns the new request's ID

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

***

### POST /api/Friending/acceptRequest

**Description:** Accepts an existing friend request, creating a friendship.

**Requirements:**

* request from sender to receiver to exist

**Effects:**

* removes friend request
* records friendship between sender and user

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

***

### POST /api/Friending/denyRequest

**Description:** Denies an existing friend request.

**Requirements:**

* request from sender to receiver to exist

**Effects:**

* removes friend request

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

***

### POST /api/Friending/removeFriend

**Description:** Removes an existing friendship between two users.

**Requirements:**

* friendship between user and to\_be\_removed\_friend must exist

**Effects:**

* removes friendship between user and to\_be\_removed\_friend

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

***

### POST /api/Friending/\_isFriends

**Description:** Checks if two users are friends.

**Requirements:**

* user1 and user2 are valid User IDs (implicit, as concept doesn't manage User existence)

**Effects:**

* returns an object with an 'areFriends' field containing an array with a single boolean indicating if users are friends

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

***

### POST /api/Friending/\_getFriends

**Description:** Retrieves a list of all friends for a given user.

**Requirements:**

* user is a valid User ID (implicit)

**Effects:**

* returns an object with a 'friends' field containing an array of User IDs that are friends with the specified user

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

***

### POST /api/Friending/\_getSentFriendRequests

**Description:** Retrieves a list of users to whom the sender has sent friend requests.

**Requirements:**

* sender is a valid User ID (implicit)

**Effects:**

* returns an object with a 'sentRequests' field containing an array of User IDs to whom the sender has sent requests

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

***

### POST /api/Friending/\_getReceivedFriendRequests

**Description:** Retrieves a list of users who have sent friend requests to the receiver.

**Requirements:**

* receiver is a valid User ID (implicit)

**Effects:**

* returns an object with a 'receivedRequests' field containing an array of User IDs who have sent requests to the receiver

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

***
