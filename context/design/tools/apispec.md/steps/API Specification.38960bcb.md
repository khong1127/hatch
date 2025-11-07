---
timestamp: 'Thu Nov 06 2025 08:45:41 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_084541.4388f35c.md]]'
content_id: 38960bcb6052a03b5c9970adcad7c85dea7c6f43eefccbcbb7b44a07d4069b1f
---

# API Specification: Friending Concept

**Purpose:** allow users to add each other as friends to share information with

***

## API Endpoints

### POST /api/Friending/sendRequest

**Description:** Sends a friend request from a sender to a receiver.

**Requirements:**

* The sender cannot be the same as the receiver.
* A friend request from the sender to the receiver must not already exist.
* A friend request from the receiver to the sender must not already exist.
* A friendship between the sender and receiver must not already exist.

**Effects:**

* Creates a new friend request from the sender to the receiver.
* Returns the ID of the newly created friend request.

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

**Description:** Accepts an existing friend request, creating a mutual friendship.

**Requirements:**

* A friend request from the sender to the receiver must exist.

**Effects:**

* Removes the friend request between the sender and receiver.
* Creates a new friendship between the sender and receiver.

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

**Description:** Denies and removes an existing friend request.

**Requirements:**

* A friend request from the sender to the receiver must exist.

**Effects:**

* Removes the friend request between the sender and receiver.

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

* A friendship between the user and the `to_be_removed_friend` must exist.

**Effects:**

* Removes the friendship between the user and the `to_be_removed_friend`.

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

* `user1` and `user2` must be valid user IDs.

**Effects:**

* Returns an array containing a single object with a boolean field `areFriends` indicating the friendship status.

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
    "areFriends": true
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

**Description:** Retrieves a list of friend IDs for a given user.

**Requirements:**

* `user` must be a valid user ID.

**Effects:**

* Returns an array of objects, where each object contains the ID of a friend in a `friend` field. Returns an empty array if the user has no friends.

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
    "friend": "string"
  },
  {
    "friend": "string"
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

**Description:** Retrieves a list of users to whom the given user has sent a friend request.

**Requirements:**

* `sender` must be a valid user ID.

**Effects:**

* Returns an array of objects, where each object contains the ID of a request receiver in a `receiver` field. Returns an empty array if the user has no pending sent requests.

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
    "receiver": "string"
  },
  {
    "receiver": "string"
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

**Description:** Retrieves a list of users who have sent a friend request to the given user.

**Requirements:**

* `receiver` must be a valid user ID.

**Effects:**

* Returns an array of objects, where each object contains the ID of a request sender in a `sender` field. Returns an empty array if the user has no pending received requests.

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
    "sender": "string"
  },
  {
    "sender": "string"
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
